# Kontekst Techniczny Projektu: Aethelgard

## Status Projektu
**Faza:** Alpha / Infinite World (v0.6)
**Ostatnia aktualizacja:** 28.01.2026

## Kluczowe Rozwiązania Techniczne (DLA AI - CZYTAJ TO!)

### 1. System Graficzny (SVG & Hybrid)
**WAŻNE:** Nie używamy bezpośrednio `ctx.drawImage(svgElement)`.
- **Pre-rendering:** Używamy patternu `prerenderImage`. Przy starcie gry (`onAssetLoad`) każdy plik jest renderowany raz na niewidoczne płótno.
- **Warianty Biomów (Optymalizacja):** Dla specjalnych biomów (np. Uytek) generujemy "pokolorowane" wersje assetów (trawa, drzewa, skały) przy użyciu filtrów CSS w `prerenderImage`. Zapobiega to spadkom wydajności (60 FPS zachowane), które występowałyby przy nakładaniu filtrów w czasie rzeczywistym.
- **Obsługa JPG:** Dodano obsługę plików JPG dla unikalnych assetów (rysunki dzieci: Uytek, Eloryba3000).
- **Z-Sorting:** Funkcja `drawScene` sortuje teraz wszystkie obiekty (zarówno moby, jak i statyczne drzewa/skały/ściany) według osi Y, co pozwala na poprawne "chowanie się" za elementami otoczenia.

### 4. Level Generation & Progression
- **Nieskończone Poziomy:** Gra generuje nową mapę proceduralnie przy każdym wejściu na schody (`tile_stairs`).
- **System Biomów:** Przy generacji poziomu losowany jest biom (np. `state.biome = 'uytek'`). Wpływa to na paletę barw otoczenia oraz typy spawnowanych przeciwników.
- **Skalowanie:** Z każdym poziomem (`state.level`) wrogowie mają więcej HP i jest ich więcej.
- **Unikalne Moby:** System spawnuje rzadkie potwory (Uytek, Eloryba3000) z określoną szansą (30%/20%) w losowych miejscach mapy. W biomie Uytek armia Uyteków staje się standardowym przeciwnikiem.

### 5. Renderowanie Sceny (Layering)
- 1. Podłoga (Trawa/Woda).
- 2. "Ciemna dziura" pod schodami.
- 3. Obiekty sortowane Y (Ściany, Drzewa, Skały, Gracz, Wrogowie, Loot).
- 4. Efekt winiety.

## Struktura Danych
- `mapData[x][y]`: 0=Trawa, 1=Ściana, 2=Woda, 3=Drzewo, 4=Skała, 5=Schody.
- `state.level`: Aktualny numer poziomu (zaczyna od 1).

### 3. Obsługa Błędów (CORS)
- Dodano `onerror` do ładowania obrazków. Jeśli gra jest uruchamiana lokalnie (file://), SVG mogą się nie załadować.
- **Zalecenie:** Zawsze sugeruj użytkownikowi użycie "Live Server" lub innego serwera lokalnego.

## Struktura Danych
- `mapData[x][y]`: 0 = podłoga, 1 = ściana.
- `enemies`: Tablica obiektów `{x, y, hp, maxHp, type, slowed?, slowUntil?, speed}`.
- `lootBags`: Tablica worków na ziemi `{x, y, items[]}`.
- `player.inventory`: Tablica przedmiotów w plecaku.
- `player.skills`: Obiekt `{fireball: {lastUsed}, frostNova: {lastUsed}, lightning: {lastUsed}}`.
- `player.selectedSkill`: Aktualnie wybrany skill lub null.

### 6. System Umiejętności (Skills)
- **Moduły:** `Skills.js` (logika), `SkillEffects.js` (efekty wizualne).
- **Aktywacja:** Klawisze Q/W/E wybierają skill, kliknięcie myszy go używa.
- **Efekty:** Renderowane na Canvas w `Renderer.js` przed winietą.
- **Slow Effect:** Wrogowie mogą być spowolnieni (property `slowed`, `slowUntil`, `speed`).

## Znane Problemy
- Przy dużej ilości wrogów sortowanie w JS może zwalniać (na razie przy <100 jest ok).
- Brak kolizji między wrogami (mogą wejść w siebie).