/* 
   ZAPYTANIE DO "TOWAR W DRODZE" (Wersja ULTRA-BEZPIECZNA)
   Usunięto filtry statusów (Stan_Id) i kolumny realizacji, aby działało na każdej wersji Nexo.
   
   To zapytanie pobiera CAŁKOWITĄ ilość towaru na dokumentach ZD (Zamówienie do Dostawcy).
*/

SELECT 
    a.Symbol AS SKU,
    a.Nazwa AS NazwaProduktu,
    SUM(p.Ilosc) AS Ilosc_W_Drodze_Total
FROM ModelDanychContainer.PozycjeDokumentu p
JOIN ModelDanychContainer.Dokumenty d ON p.Dokument_Id = d.Id
JOIN ModelDanychContainer.Asortymenty a ON p.AsortymentAktualnyId = a.Id
WHERE d.Symbol = 'ZD' -- Tylko Zamówienia do Dostawcy
GROUP BY a.Symbol, a.Nazwa
ORDER BY Ilosc_W_Drodze_Total DESC
