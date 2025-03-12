SELECT 
	P.GamerTag,
	P.ProfilePicture,
	PS.TotalSetWins AS "Set Wins",
	PS.TotalSetLosses AS "Set Losses",
	PS.TotalGameWins AS "Game Wins",
	PS.TotalGameLosses AS "Game Losses",
	ROUND((CAST((PS.TotalSetWins * 100::FLOAT) AS NUMERIC)) / (PS.TotalSetWins + PS.TotalSetLosses), 2) AS "Win Percentage",
	COUNT(DISTINCT s.EventID) AS "Events Participated In"
FROM PlayerStats PS
LEFT JOIN Players P ON P.PlayerID = PS.PlayerID
LEFT JOIN (
    SELECT PlayerOneID AS PlayerID, EventID FROM Sets WHERE HasDQ = FALSE
    UNION 
    SELECT PlayerTwoID AS PlayerID, EventID FROM Sets WHERE HasDQ = FALSE
) s ON p.PlayerID = s.PlayerID
WHERE P.PlayerID = $1
GROUP BY P.GamerTag, P.ProfilePicture, PS.TotalSetWins, PS.TotalSetLosses, PS.TotalGameWins, PS.TotalGameLosses