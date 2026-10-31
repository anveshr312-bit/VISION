"""
VISION: Deep Time-Series Sequence Models & Causal Prognostics Core
Vital Intelligence for System Integrity, Observation & Nostics

Aerospace Telemetry Modeling:
-----------------------------
Turbofan engine degradation exhibits complex temporal dynamics across thermodynamic
state variables. Point-in-time cross-sectional features miss multi-cycle cumulative
wear patterns (e.g. cumulative thermal creep, progressive blade erosion).

Architectures:
--------------
1. AeroTCN: Temporal Convolutional Network with 1D dilated causal convolutions
   (dilations 1, 2, 4, 8), kernel size 3, residual connections, and dropout 0.2.
   Strictly zero future-cycle leakage via left-only padding.
2. AeroBiGRU: 2-layer Bidirectional GRU (hidden dim 64) with temporal additive
   attention pooling to weight critical inflection cycles.
3. AeroLoss: Combined loss uniting Huber regression, asymmetric late penalty
   (lambda * max(y_hat - y, 0)^2), and multi-quantile pinball loss.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

import numpy as np
import pandas as pd

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    nn = object

from ml.config import DATA_ARTIFACTS_DIR, RUL_CAP, SENSORS_KEEP
from ml.models.quantile_heads import DEFAULT_QUANTILES, AsymmetricHuberLoss, PinballLoss


# -----------------------------------------------------------------------------
# Sequence Generation & Causal Windowing
# -----------------------------------------------------------------------------

def create_engine_sequences(
    df: pd.DataFrame,
    window_size: int = 30,
    feature_cols: Optional[Sequence[str]] = None,
    rul_col: str = "rul",
    rul_cap: float = float(RUL_CAP),
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Extract sliding temporal sequences strictly grouped by engine unit.

    For early cycles (cycle index < window_size), pads causal history on the left
    with edge replication (repeating initial cycle state). This guarantees that:
    1. Every cycle produces an inference sample.
    2. No future cycles are leaked into the historical window.

    Parameters
    ----------
    df : pd.DataFrame
        Telemetry records containing 'unit', 'cycle', sensor channels, and RUL.
    window_size : int
        Number of historical cycles per sequence (W = 30 or 50).
    feature_cols : Sequence[str], optional
        Sensor column names. Defaults to SENSORS_KEEP (14 channels).
    rul_col : str
        Column name for ground-truth RUL.
    rul_cap : float
        Upper threshold for piecewise-linear RUL capping (125).

    Returns
    -------
    X : np.ndarray
        Array of shape (total_cycles, window_size, len(feature_cols)).
    y : np.ndarray
        Target RUL array of shape (total_cycles,), capped at rul_cap.
    units : np.ndarray
        Engine unit IDs corresponding to each sequence window.
    cycles : np.ndarray
        Operating cycle corresponding to the final timestep in each window.
    """
    features = list(feature_cols) if feature_cols is not None else list(SENSORS_KEEP)
    sequences: List[np.ndarray] = []
    targets: List[np.ndarray] = []
    unit_ids: List[np.ndarray] = []
    cycle_ids: List[np.ndarray] = []

    for unit, grp in df.groupby("unit"):
        arr = grp[features].to_numpy(dtype=np.float32)
        T = len(arr)
        if T == 0:
            continue

        if rul_col in grp.columns:
            ruls = np.minimum(grp[rul_col].to_numpy(dtype=np.float32), rul_cap)
        else:
            ruls = np.zeros(T, dtype=np.float32)

        cycs = grp["cycle"].to_numpy(dtype=np.int32)

        # Causal Edge Replication Padding: pad (window_size - 1) cycles on the left
        padded = np.pad(arr, ((window_size - 1, 0), (0, 0)), mode="edge")

        # Sliding window along time axis
        windows = np.lib.stride_tricks.sliding_window_view(
            padded, window_shape=window_size, axis=0
        )
        # Reshape from (T, features, window_size) to (T, window_size, features)
        windows = np.transpose(windows, (0, 2, 1))

        sequences.append(windows)
        targets.append(ruls)
        unit_ids.append(np.full(T, unit, dtype=np.int32))
        cycle_ids.append(cycs)

    X_all = np.concatenate(sequences, axis=0) if sequences else np.empty((0, window_size, len(features)))
    y_all = np.concatenate(targets, axis=0) if targets else np.empty((0,))
    u_all = np.concatenate(unit_ids, axis=0) if unit_ids else np.empty((0,), dtype=np.int32)
    c_all = np.concatenate(cycle_ids, axis=0) if cycle_ids else np.empty((0,), dtype=np.int32)

    return X_all, y_all, u_all, c_all


def create_test_last_sequences(
    test_df: pd.DataFrame,
    window_size: int = 30,
    feature_cols: Optional[Sequence[str]] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extract the single final observation sequence per test engine.
    Matches the official NASA C-MAPSS evaluation protocol.

    Returns
    -------
    X_test : np.ndarray
        Array of shape (n_test_engines, window_size, n_features).
    unit_ids : np.ndarray
        Test unit IDs.
    """
    features = list(feature_cols) if feature_cols is not None else list(SENSORS_KEEP)
    windows: List[np.ndarray] = []
    unit_ids: List[int] = []

    for unit, grp in test_df.groupby("unit"):
        arr = grp[features].to_numpy(dtype=np.float32)
        T = len(arr)
        if T < window_size:
            pad_len = window_size - T
            padded = np.pad(arr, ((pad_len, 0), (0, 0)), mode="edge")
            window = padded
        else:
            window = arr[-window_size:]

        windows.append(window)
        unit_ids.append(int(unit))

    return np.array(windows, dtype=np.float32), np.array(unit_ids, dtype=np.int32)


# -----------------------------------------------------------------------------
# Deep Neural Network Architectures (PyTorch)
# -----------------------------------------------------------------------------

if HAS_TORCH:

    class CausalConv1d(nn.Module):
        """
        1D Causal Convolution with zero right-side padding to prevent future leakage.
        """

        def __init__(
            self,
            in_channels: int,
            out_channels: int,
            kernel_size: int = 3,
            dilation: int = 1,
        ) -> None:
            super().__init__()
            self.pad = (kernel_size - 1) * dilation
            self.conv = nn.Conv1d(
                in_channels,
                out_channels,
                kernel_size=kernel_size,
                dilation=dilation,
                padding=0,
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x shape: (batch_size, in_channels, seq_len)
            x_padded = F.pad(x, (self.pad, 0))
            return self.conv(x_padded)

    class TemporalBlock(nn.Module):
        """
        Residual Temporal Block comprising two dilated causal convolutions,
        Mish/ReLU activation, dropout, and a 1x1 downsample projection.
        """

        def __init__(
            self,
            in_channels: int,
            out_channels: int,
            kernel_size: int = 3,
            dilation: int = 1,
            dropout: float = 0.2,
        ) -> None:
            super().__init__()
            self.conv1 = CausalConv1d(in_channels, out_channels, kernel_size, dilation=dilation)
            self.act1 = nn.Mish()
            self.drop1 = nn.Dropout(dropout)

            self.conv2 = CausalConv1d(out_channels, out_channels, kernel_size, dilation=dilation)
            self.act2 = nn.Mish()
            self.drop2 = nn.Dropout(dropout)

            self.downsample = (
                nn.Conv1d(in_channels, out_channels, 1) if in_channels != out_channels else None
            )
            self.act_out = nn.Mish()

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            residual = x if self.downsample is None else self.downsample(x)
            out = self.drop1(self.act1(self.conv1(x)))
            out = self.drop2(self.act2(self.conv2(out)))
            return self.act_out(out + residual)

    class AeroTCN(nn.Module):
        """
        Aero-Engine Temporal Convolutional Network.

        Architecture:
        - 1D Dilated Causal Convolutions with residual connections
        - Dilations: [1, 2, 4, 8]
        - Kernel size: 3
        - Dropout: 0.2
        - Multi-head output: Point RUL prediction + 5 quantiles [0.05, 0.10, 0.50, 0.90, 0.95].
        """

        def __init__(
            self,
            in_channels: int = 14,
            num_outputs: int = 6,
            channels: Sequence[int] = (32, 32, 48, 48),
            kernel_size: int = 3,
            dropout: float = 0.2,
        ) -> None:
            super().__init__()
            self.in_channels = in_channels
            self.num_outputs = num_outputs
            self.channels = list(channels)

            layers: List[nn.Module] = []
            dilations = [1, 2, 4, 8]
            for i in range(len(self.channels)):
                in_ch = in_channels if i == 0 else self.channels[i - 1]
                out_ch = self.channels[i]
                layers.append(
                    TemporalBlock(
                        in_channels=in_ch,
                        out_channels=out_ch,
                        kernel_size=kernel_size,
                        dilation=dilations[i % len(dilations)],
                        dropout=dropout,
                    )
                )

            self.tcn = nn.Sequential(*layers)
            self.head = nn.Sequential(
                nn.Linear(self.channels[-1], 32),
                nn.Mish(),
                nn.Dropout(dropout),
                nn.Linear(32, num_outputs),
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # Input x: (batch_size, seq_len, in_channels)
            # PyTorch Conv1d expects: (batch_size, in_channels, seq_len)
            x_perm = x.transpose(1, 2)
            features = self.tcn(x_perm)  # (batch_size, channels[-1], seq_len)
            last_step = features[:, :, -1]  # Take causal final step
            return self.head(last_step)

    class AeroBiGRU(nn.Module):
        """
        Aero-Engine 2-Layer Bidirectional GRU with Temporal Additive Attention Pooling.

        Architecture:
        - 2-layer Bidirectional GRU (hidden dim 64 -> 128 bidirectional features)
        - Temporal additive attention mechanism:
            u_t = tanh(W * h_t + b)
            alpha_t = softmax(v^T * u_t)
            context = sum(alpha_t * h_t)
        - Multi-head output: Point RUL + 5 quantiles [0.05, 0.10, 0.50, 0.90, 0.95].
        """

        def __init__(
            self,
            in_channels: int = 14,
            num_outputs: int = 6,
            hidden_dim: int = 64,
            num_layers: int = 2,
            dropout: float = 0.2,
        ) -> None:
            super().__init__()
            self.in_channels = in_channels
            self.num_outputs = num_outputs
            self.hidden_dim = hidden_dim
            self.num_layers = num_layers

            self.gru = nn.GRU(
                input_size=in_channels,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                bidirectional=True,
                dropout=dropout if num_layers > 1 else 0.0,
            )

            # Additive Attention Layers
            self.w_omega = nn.Linear(hidden_dim * 2, 64)
            self.u_omega = nn.Linear(64, 1, bias=False)

            # Regression Head
            self.head = nn.Sequential(
                nn.Linear(hidden_dim * 2, 32),
                nn.Mish(),
                nn.Dropout(dropout),
                nn.Linear(32, num_outputs),
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x: (batch_size, seq_len, in_channels)
            gru_out, _ = self.gru(x)  # (batch_size, seq_len, hidden_dim * 2)

            # Temporal Additive Attention Pooling
            u = torch.tanh(self.w_omega(gru_out))  # (batch_size, seq_len, 64)
            att_scores = self.u_omega(u)  # (batch_size, seq_len, 1)
            att_weights = torch.softmax(att_scores, dim=1)
            context = torch.sum(gru_out * att_weights, dim=1)  # (batch_size, hidden_dim * 2)

            return self.head(context)

    class AeroLoss(nn.Module):
        """
        Composite loss uniting:
        1. Asymmetric Huber loss for point prediction with late penalty lambda * max(y_hat - y, 0)^2.
        2. Multi-quantile pinball loss for empirical distribution estimation.
        """

        def __init__(
            self,
            delta: float = 1.0,
            late_weight: float = 0.05,
            pinball_weight: float = 1.0,
            quantiles: Sequence[float] = DEFAULT_QUANTILES,
        ) -> None:
            super().__init__()
            self.asym_huber = AsymmetricHuberLoss(delta=delta, late_weight=late_weight)
            self.pinball = PinballLoss(quantiles=quantiles)
            self.pinball_weight = float(pinball_weight)

        def forward(self, y_pred: torch.Tensor, y_true: torch.Tensor) -> torch.Tensor:
            # y_pred: (B, 6). col 0 = point prediction, cols 1..5 = quantiles
            pt_pred = y_pred[:, 0]
            q_pred = y_pred[:, 1:6]

            loss_pt = self.asym_huber(pt_pred, y_true)
            loss_q = self.pinball(q_pred, y_true)

            return loss_pt + self.pinball_weight * loss_q

else:
    class CausalConv1d:  # type: ignore
        pass

    class TemporalBlock:  # type: ignore
        pass

    class AeroTCN:  # type: ignore
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for AeroTCN")

    class AeroBiGRU:  # type: ignore
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for AeroBiGRU")

    class AeroLoss:  # type: ignore
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for AeroLoss")


# -----------------------------------------------------------------------------
# Checkpoint Saving & Loading
# -----------------------------------------------------------------------------

def save_torch_model(
    model: Any,
    path: Union[str, Path],
    metadata: Optional[Dict[str, Any]] = None,
) -> Path:
    """Save PyTorch model state_dict along with architecture hyperparameters."""
    if not HAS_TORCH:
        raise ImportError("PyTorch required to save model")
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)

    arch_name = "bigru" if isinstance(model, AeroBiGRU) else "tcn"
    payload = {
        "arch": arch_name,
        "state_dict": model.state_dict(),
        "in_channels": getattr(model, "in_channels", 14),
        "num_outputs": getattr(model, "num_outputs", 6),
        "metadata": metadata or {},
    }
    torch.save(payload, p)
    return p


def load_torch_model(
    path: Union[str, Path],
    map_location: str = "cpu",
) -> Any:
    """Load PyTorch sequence model from checkpoint file."""
    if not HAS_TORCH:
        raise ImportError("PyTorch required to load model")
    p = Path(path)
    checkpoint = torch.load(p, map_location=map_location, weights_only=False)
    arch = checkpoint.get("arch", "tcn")
    in_channels = checkpoint.get("in_channels", 14)
    num_outputs = checkpoint.get("num_outputs", 6)

    if arch == "bigru":
        model = AeroBiGRU(in_channels=in_channels, num_outputs=num_outputs)
    else:
        model = AeroTCN(in_channels=in_channels, num_outputs=num_outputs)

    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    return model

