def compute_anomaly_score(features: dict) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []

    if features["absence_rate"] > 0.35:
        score += 0.3
        reasons.append("Taux d'absence élevé")

    if features["retard_rate"] > 0.25:
        score += 0.2
        reasons.append("Taux de retard élevé")

    if features["max_consecutive_absences"] >= 3:
        score += 0.3
        reasons.append("Absences consécutives")

    if features["absent"] >= 5:
        score += 0.2
        reasons.append("Nombre total d'absences élevé")

    return min(score, 1.0), reasons
