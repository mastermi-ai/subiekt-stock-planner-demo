-- 1. Sprawdzenie liczby unikalnych towarów (Towary i Usługi)
-- Porównaj to z liczbą "Products" w Planerze (~10,200)
SELECT 'Liczba Towarow (Aktywnych)' as Opis, COUNT(*) as Licznik 
FROM Tw_Towar 
WHERE tw_Zablokowany = 0 AND tw_Rodzaj = 1;

-- 2. Sprawdzenie liczby Magazynów
-- Porównaj to z liczbą "Branches" w Planerze (14)
SELECT 'Liczba Magazynow' as Opis, COUNT(*) as Licznik 
FROM Sl_Magazyn 
WHERE mag_Anulowany = 0;

-- 3. Lista Magazynów (dla pewności)
SELECT mag_Id, mag_Symbol, mag_Nazwa 
FROM Sl_Magazyn 
WHERE mag_Anulowany = 0;

-- 4. Całkowita liczba rekordów stanów magazynowych
-- To jest liczba par (Towar + Magazyn). Porównaj to z liczbą "Stocks" (~26,000+)
-- Jeśli towar jest na 3 magazynach, to tutaj będą 3 rekordy.
SELECT 'Liczba Rekordow Stanu' as Opis, COUNT(*) as Licznik 
FROM Tw_Stan;
