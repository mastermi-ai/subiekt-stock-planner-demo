-- POPRAWIONY SKRYPT WERYFIKACYJNY (NEXO PRO) v2
-- Usunięto filtrowanie po kolumnie 'Rodzaj', która może nie istnieć w tej wersji widoku.

-- 1. Liczba Wszystkich Kartotek (Towary + Usługi)
-- To powinna być liczba zbliżona do 10,200 (może być nieco wyższa, jeśli masz usługi)
SELECT 'Liczba Kartotek (Asortyment)' as Opis, COUNT(*) as Licznik 
FROM ModelDanychContainer.Asortymenty;

-- 2. Lista Oddziałów (Magazynów)
-- Sprawdzamy, ile system widzi oddziałów (Id >= 100000 to zazwyczaj oddziały użytkownika)
SELECT Id, Symbol 
FROM ModelDanychContainer.JednostkiOrganizacyjne
WHERE Id >= 100000;

-- 3. Weryfikacja "Sztucznych" Stanów Magazynowych
-- Nexo pokazuje stan towaru DLA KAŻDEGO ODDZIAŁU.
-- Wynik tego zapytania powinien pokrywać się z liczbą "Stocks" w Planerze (~33,000+)
SELECT 'Liczba Rekordow Stanu (Towar x Oddzial)' as Opis, COUNT(*) as Licznik
FROM ModelDanychContainer.StanyMagazynowe s
CROSS JOIN ModelDanychContainer.JednostkiOrganizacyjne j
WHERE s.IloscDostepna > 0
  AND j.Id >= 100000;
