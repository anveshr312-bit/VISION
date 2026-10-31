import json, time, sys, warnings, pickle
from scipy.stats import beta
import numpy as np, pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import GroupKFold
warnings.filterwarnings("ignore")
# NASA C-MAPSS files (train_FD00x.txt, test_FD00x.txt, RUL_FD00x.txt) must be in DATA_DIR.
# Official source: NASA Prognostics Data Repository, "Turbofan Engine Degradation Simulation Data Set".
import os
D = os.environ.get("CMAPSS_DIR", "./cmapss/")
if not D.endswith("/"): D += "/"
RESULTS = os.environ.get("RESULTS_JSON", "results.json")
COLS = ["unit", "cycle", "op1", "op2", "op3"] + [f"s{i}" for i in range(1, 22)]
KEEP = [f"s{i}" for i in (2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21)]
CAP = 125
OUT = {}


def load(n):
    tr = pd.read_csv(D + f"train_FD00{n}.txt", sep=r"\s+", header=None, names=COLS)
    te = pd.read_csv(D + f"test_FD00{n}.txt", sep=r"\s+", header=None, names=COLS)
    rul = pd.read_csv(D + f"RUL_FD00{n}.txt", header=None)[0].values
    mx = tr.groupby("unit")["cycle"].transform("max")
    tr["rul"] = mx - tr["cycle"]
    return tr, te, rul


def normalize(tr, te, per_regime, n_reg):
    tr, te = tr.copy(), te.copy()
    if per_regime and n_reg > 1:
        km = KMeans(n_clusters=n_reg, n_init=10, random_state=0).fit(tr[["op1", "op2", "op3"]])
        tr["reg"], te["reg"] = km.labels_, km.predict(te[["op1", "op2", "op3"]])
        for s in KEEP:
            mu = tr.groupby("reg")[s].transform("mean"); sd = tr.groupby("reg")[s].transform("std").replace(0, 1)
            mu_m = tr.groupby("reg")[s].mean(); sd_m = tr.groupby("reg")[s].std().replace(0, 1)
            tr[s] = (tr[s] - mu) / sd
            te[s] = (te[s] - te["reg"].map(mu_m)) / te["reg"].map(sd_m)
    else:
        for s in KEEP:
            mu, sd = tr[s].mean(), tr[s].std() or 1
            tr[s] = (tr[s] - mu) / sd; te[s] = (te[s] - mu) / sd
    return tr, te


def feats(df):
    g = df.groupby("unit")
    F = {}
    for s in KEEP:
        m5 = g[s].transform(lambda v: v.rolling(5, min_periods=1).mean())
        m30 = g[s].transform(lambda v: v.rolling(30, min_periods=1).mean())
        sd = g[s].transform(lambda v: v.rolling(10, min_periods=2).std()).fillna(0)
        F[s] = df[s].values; F[s + "_m5"] = m5.values; F[s + "_d"] = (m5 - m30).values; F[s + "_sd"] = sd.values
    F["cycle"] = df["cycle"].values
    return pd.DataFrame(F)


def mk():
    return HistGradientBoostingRegressor(max_iter=300, learning_rate=0.06, max_leaf_nodes=31,
                                         min_samples_leaf=40, l2_regularization=1.0, random_state=0)


def nasa(d):
    return float(np.sum(np.where(d < 0, np.exp(-d / 13) - 1, np.exp(d / 10) - 1)))


def rmse(d): return float(np.sqrt(np.mean(d ** 2)))


def boot_ci(d, B=2000, seed=0):
    r = np.random.default_rng(seed); n = len(d)
    v = [rmse(d[r.integers(0, n, n)]) for _ in range(B)]
    return [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))]


def last_rows(te):
    return te.groupby("unit").tail(1).index.values



# ---------------- Experiment A: protocol / normalization ablation + test eval ----------------
cache, res_A, boot_pair = {}, {}, {}
for n in (1, 2, 3, 4):
    t0 = time.time()
    tr, te, rul = load(n)
    n_reg = 6 if n in (2, 4) else 1
    res_A[f"FD00{n}"] = {}; dd = {}
    for mode in ("global", "per_regime"):
        trn, ten = normalize(tr, te, mode == "per_regime", n_reg)
        Xtr, Xte = feats(trn), feats(ten)
        y = np.minimum(tr["rul"].values, CAP)
        m = mk().fit(Xtr, y)
        idx = last_rows(ten)
        p = np.clip(m.predict(Xte.loc[idx]), 0, CAP)
        d = p - np.minimum(rul, CAP); dd[mode] = d
        res_A[f"FD00{n}"][mode] = {"rmse": rmse(d), "score": nasa(d), "ci": boot_ci(d)}
        if mode == "per_regime":
            cache[n] = (tr, te, rul, trn, ten, Xtr, Xte, y, m, p, d)
    if n in (2, 4):
        r = np.random.default_rng(1); k = len(dd["global"]); diffs = []
        for _ in range(4000):
            ii = r.integers(0, k, k); diffs.append(rmse(dd["global"][ii]) - rmse(dd["per_regime"][ii]))
        boot_pair[f"FD00{n}"] = {"delta_rmse": rmse(dd["global"]) - rmse(dd["per_regime"]),
                                 "ci": [float(np.percentile(diffs, 2.5)), float(np.percentile(diffs, 97.5))]}
    print(n, res_A[f"FD00{n}"], round(time.time() - t0), "s", flush=True)
OUT["A"] = res_A; OUT["A_paired"] = boot_pair
print("paired", boot_pair, flush=True)
# ---------------- Experiment B+C: conformal + decision simulation (FD001, FD004) ----------------
EDGES = [-1e9, 15, 30, 50, 75, 100, 115, 1e9]
LEAD = 15


def bucket(p): return np.digitize(p, EDGES[1:-1])


def q_fin(v, a):
    n = len(v)
    if n == 0: return 0.0
    k = min(n, int(np.ceil((n + 1) * (1 - a))))
    return float(np.sort(v)[k - 1])


def calib_q(p_cal, y_cal, a, kind):
    b = bucket(p_cal); out = {}
    for k in range(len(EDGES) - 1):
        msk = b == k
        r = (p_cal[msk] - y_cal[msk]) if kind == "lb" else np.abs(p_cal[msk] - y_cal[msk])
        out[k] = q_fin(r, a) if msk.sum() >= 30 else None
    # fallback to global quantile for sparse buckets
    allr = (p_cal - y_cal) if kind == "lb" else np.abs(p_cal - y_cal)
    g = q_fin(allr, a)
    return {k: (v if v is not None else g) for k, v in out.items()}


res_B, res_C = {}, {}
for n in (1, 4):
    t0 = time.time()
    tr, te, rul, trn, ten, Xtr, Xte, y, m, p_test, d_test = cache[n]
    units = tr["unit"].values
    oof = np.zeros(len(tr))
    fold = np.zeros(len(tr), dtype=int)
    for k, (a_, b_) in enumerate(GroupKFold(5).split(Xtr, y, units)):
        oof[b_] = np.clip(mk().fit(Xtr.iloc[a_], y[a_]).predict(Xtr.iloc[b_]), 0, CAP)
        fold[b_] = k
    print(n, "oof done", round(time.time() - t0), "s; oof rmse", rmse(oof - y), flush=True)

    # --- B: conformal coverage on official test last-window, calibrated on OOF residuals (all train) ---
    idx = last_rows(ten); ytrue = np.minimum(rul, CAP)
    cov = {}
    for a in (0.2, 0.1, 0.05):
        q = calib_q(oof, y, a, "abs")
        qq = np.array([q[k] for k in bucket(p_test)])
        lo, hi = p_test - qq, p_test + qq
        covered = (ytrue >= lo) & (ytrue <= hi)
        cov[str(a)] = {"target": 1 - a, "coverage": float(covered.mean()), "mean_width": float((hi - lo).mean())}
    # naive (non-Mondrian) global interval for comparison
    naive = {}
    for a in (0.1,):
        q = q_fin(np.abs(oof - y), a)
        covered = (ytrue >= p_test - q) & (ytrue <= p_test + q)
        naive[str(a)] = {"coverage": float(covered.mean()), "mean_width": float(2 * q)}
    # one-sided lower-bound safety: fraction where true RUL >= LB
    lbsafe = {}
    for a in (0.1, 0.05):
        q = calib_q(oof, y, a, "lb")
        LB = p_test - np.array([q[k] for k in bucket(p_test)])
        lbsafe[str(a)] = {"target": 1 - a, "safe_frac": float((ytrue >= LB).mean())}
    res_B[f"FD00{n}"] = {"two_sided": cov, "naive_global_90": naive, "lower_bound": lbsafe, "n_engines": int(len(ytrue)),
                         "test_pred": p_test.tolist(), "test_true": ytrue.tolist()}
    # keep band for plotting (alpha=0.1)
    q = calib_q(oof, y, 0.1, "abs"); qq = np.array([q[k] for k in bucket(p_test)])
    res_B[f"FD00{n}"]["band90"] = qq.tolist()

    # --- C: decision simulation on held-out (OOF) trajectories, cross-calibrated per fold ---
    a = 0.10
    LBs = np.zeros(len(tr))
    for k in range(5):
        cal = fold != k
        qk = calib_q(oof[cal], y[cal], a, "lb")
        msk = fold == k
        LBs[msk] = oof[msk] - np.array([qk[j] for j in bucket(oof[msk])])
    df = pd.DataFrame({"unit": units, "cycle": tr["cycle"].values, "p": oof, "lb": LBs})
    T = df.groupby("unit")["cycle"].max()
    N = len(T)

    def run_trigger(col, thr, persist=1):
        fails, wasted = 0, []
        for u, g in df.groupby("unit"):
            ok = (g[col].values <= thr).astype(int)
            if persist > 1:
                ok = (np.convolve(ok, np.ones(persist, dtype=int), "full")[:len(ok)] >= persist).astype(int)
            hit = np.nonzero(ok)[0]
            Tu = T[u]
            if len(hit) == 0: fails += 1; continue
            t_exec = g["cycle"].values[hit[0]] + LEAD
            if t_exec >= Tu: fails += 1
            else: wasted.append(Tu - t_exec)
        return fails / N, (float(np.mean(wasted)) if wasted else np.nan), (float(np.mean(np.array(wasted) / T.values.mean())) if wasted else np.nan)

    def run_fixed(c):
        fails = int((T.values <= c).sum()); w = (T.values[T.values > c] - c)
        return fails / N, (float(w.mean()) if len(w) else np.nan)

    curves = {"fixed": [], "point": [], "lower90": [], "lower90_persist3": []}
    for c in range(40, int(T.max()) + 1, 4):
        f, w = run_fixed(c); curves["fixed"].append((f, w))
    for thr in range(0, 126, 3):
        f, w, _ = run_trigger("p", thr); curves["point"].append((f, w))
        f, w, _ = run_trigger("lb", thr); curves["lower90"].append((f, w))
        f, w, _ = run_trigger("lb", thr, 3); curves["lower90_persist3"].append((f, w))

    def best_at(curve, fmax):
        c = [w for f, w in curve if f <= fmax + 1e-9 and not np.isnan(w)]
        return float(min(c)) if c else None
    table = {}
    for fmax in (0.0, 0.01, 0.02, 0.05):
        table[str(fmax)] = {k: best_at(v, fmax) for k, v in curves.items()}
    res_C[f"FD00{n}"] = {"table_min_wasted_cycles": table, "curves": curves, "N": int(N),
                         "mean_life": float(T.mean()), "lead": LEAD}
    print(n, "sim done", round(time.time() - t0), "s", json.dumps(table), flush=True)

    # --- D: held-out threshold selection; naive in-sample vs risk-controlled (Clopper-Pearson) ---
    units_list = list(T.index); Tarr = T.values.astype(float); NE = len(units_list)
    per_unit = {u: (g["cycle"].values, g["p"].values, g["lb"].values) for u, g in df.groupby("unit")}
    thr_grid = list(range(0, 126, 3)); c_grid = list(range(40, int(T.max()) + 1, 4))

    def persist_ok(ok, k):
        return (np.convolve(ok.astype(int), np.ones(k, dtype=int), "full")[:len(ok)] >= k)

    def unit_outcome(u, pol, thr):
        cyc, p, lb = per_unit[u]; Tu = T[u]
        if pol == "fixed":
            return (1, np.nan) if Tu <= thr else (0, Tu - thr)
        ok = (p <= thr) if pol == "point" else (lb <= thr)
        if pol == "lower90_persist3": ok = persist_ok(ok, 3)
        hit = np.nonzero(ok)[0]
        if len(hit) == 0: return 1, np.nan
        te_ = cyc[hit[0]] + LEAD
        return (1, np.nan) if te_ >= Tu else (0, Tu - te_)

    FAIL, WASTE, GRID = {}, {}, {}
    for pol in ("fixed", "point", "lower90", "lower90_persist3"):
        grid = c_grid if pol == "fixed" else thr_grid; GRID[pol] = grid
        FAIL[pol] = np.zeros((len(grid), NE)); WASTE[pol] = np.full((len(grid), NE), np.nan)
        for gi, th in enumerate(grid):
            for ei, u in enumerate(units_list):
                f, w = unit_outcome(u, pol, th); FAIL[pol][gi, ei] = f; WASTE[pol][gi, ei] = w

    def choose(pol, idx, target, controlled, conf=0.9):
        best, bw = None, np.inf
        for gi in range(len(GRID[pol])):
            k = FAIL[pol][gi, idx].sum(); nn = len(idx)
            rate = k / nn
            ub = 1.0 if k >= nn else float(beta.ppf(conf, k + 1, nn - k))
            okc = (ub <= target) if controlled else (rate <= target)
            if not okc: continue
            w = np.nanmean(WASTE[pol][gi, idx]) if (FAIL[pol][gi, idx] == 0).any() else np.inf
            if w < bw: bw, best = w, gi
        return best

    TARGET = 0.05; reps = 200; rr = np.random.default_rng(7)
    outD = {}
    for pol in ("fixed", "point", "lower90", "lower90_persist3"):
        for mode in ("naive", "controlled"):
            fr, ws, viol, feas = [], [], 0, 0
            for _ in range(reps):
                perm = rr.permutation(NE); a_, b_ = perm[:NE // 2], perm[NE // 2:]
                gi = choose(pol, a_, TARGET, mode == "controlled")
                if gi is None: continue
                feas += 1
                f = FAIL[pol][gi, b_].mean(); fr.append(f)
                ok = FAIL[pol][gi, b_] == 0
                ws.append(float(np.nanmean(WASTE[pol][gi, b_][ok])) if ok.any() else np.nan)
                viol += int(f > TARGET)
            outD[f"{pol}|{mode}"] = {"feasible_frac": feas / reps, "mean_fail_rate": float(np.mean(fr)) if fr else None,
                                     "viol_frac": viol / max(feas, 1), "mean_wasted": float(np.nanmean(ws)) if ws else None}
    res_C[f"FD00{n}"]["D_heldout"] = outD
    print(n, "D", json.dumps({k: {a: (round(b, 3) if b is not None else None) for a, b in v.items()} for k, v in outD.items()}), flush=True)
    df.to_pickle(f"/tmp/oof_fd00{n}.pkl")

OUT["B"], OUT["C"] = res_B, res_C
json.dump(OUT, open(RESULTS, "w"))
print("DONE")
