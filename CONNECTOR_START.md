# SZYBKI START KONEKTORA

## Opcja 1: Uruchom w PowerShell (tymczasowo)

```powershell
# Przejdź do folderu publish
cd C:\Users\User\Desktop\publish

# Uruchom connector
.\SubiektConnector.exe
```

**UWAGA:** To okno PowerShell musi pozostać otwarte!

---

## Opcja 2: Zainstaluj jako Windows Service (zalecane)

```powershell
# W PowerShell jako Administrator:

# 1. Przejdź do folderu
cd C:\Users\User\Desktop\publish

# 2. Zainstaluj service
.\install-service.ps1

# 3. Uruchom service
Start-Service SubiektConnector

# 4. Sprawdź status
Get-Service SubiektConnector

# 5. Zobacz logi
Get-Content "C:\ProgramData\PlannerConnector\logs\$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 20 -Wait
```

**Korzyści Windows Service:**
- ✅ Działa w tle (nie potrzebuje PowerShell)
- ✅ Automatyczny restart po reboot
- ✅ Uruchamia się przy starcie Windows
- ✅ Można zamknąć wszystkie okna

---

## Sprawdź który sposób jest aktualnie ustawiony:

```powershell
# Sprawdź czy service istnieje
Get-Service SubiektConnector -ErrorAction SilentlyContinue

# Jeśli pokazuje wynik = service zainstalowany
# Jeśli puste = service NIE zainstalowany (tylko PowerShell)
```
