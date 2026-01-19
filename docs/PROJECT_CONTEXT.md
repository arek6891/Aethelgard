# Kontekst Techniczny Projektu: Aethelgard

## Status Projektu
**Faza:** Alpha / Infinite World (v0.4)
**Ostatnia aktualizacja:** 19.01.2026

## Kluczowe Rozwiązania Techniczne (DLA AI - CZYTAJ TO!)

### 1. System Graficzny (SVG & Hybrid)
**WAŻNE:** Nie używamy bezpośrednio `ctx.drawImage(svgElement)`.
- **Pre-rendering:** Używamy patternu `prerenderImage`. Przy starcie gry (`onAssetLoad`) każdy plik jest renderowany raz na niewidoczne płótno.
- **Obsługa JPG:** Dodano obsługę plików JPG dla unikalnych assetów (rysunki dzieci: Uytek, Eloryba3000).
- **Z-Sorting:** Funkcja `drawScene` sortuje teraz wszystkie obiekty (zarówno moby, jak i statyczne drzewa/skały/ściany) według osi Y, co pozwala na poprawne "chowanie się" za elementami otoczenia.

### 2. Audio System (Synthesized)
- Nie używamy plików MP3/WAV.
- Moduł `src/Audio.js` generuje dźwięki (SFX) w locie za pomocą **Web Audio API**.

### 3. Equipment & Stats System
- Gracz ma sloty: head, chest, mainhand, offhand, legs.
- Przedmioty w `state.player.equipment` modyfikują statystyki (STR, DEX, INT, HP) w czasie rzeczywistym.

### 4. Level Generation & Progression
- **Nieskończone Poziomy:** Gra generuje nową mapę proceduralnie przy każdym wejściu na schody (`tile_stairs`).
- **Skalowanie:** Z każdym poziomem (`state.level`) wrogowie mają więcej HP i jest ich więcej.
- **Unikalne Moby:** System spawnuje rzadkie potwory (Uytek, Eloryba3000) z określoną szansą (30%/20%) w losowych miejscach mapy.

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
- `enemies`: Tablica obiektów `{x, y, hp, maxHp, type}`.
- `lootBags`: Tablica worków na ziemi `{x, y, items[]}`.
- `player.inventory`: Tablica przedmiotów w plecaku.

## Znane Problemy
- Przy dużej ilości wrogów sortowanie w JS może zwalniać (na razie przy <100 jest ok).
- Brak kolizji między wrogami (mogą wejść w siebie).