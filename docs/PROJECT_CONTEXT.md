# Kontekst Techniczny Projektu: Aethelgard

## Status Projektu
**Faza:** Alpha / Prototyp Mechaniki (v0.3)
**Ostatnia aktualizacja:** 18.01.2026

## Kluczowe Rozwiązania Techniczne (DLA AI - CZYTAJ TO!)

### 1. System Graficzny (SVG Rasterization)
**WAŻNE:** Nie używamy bezpośrednio `ctx.drawImage(svgElement)`.
- Przeglądarki dławią się przy renderowaniu wektorów w pętli 60 FPS.
- **Rozwiązanie:** Używamy patternu `prerenderImage`. Przy starcie gry (`onAssetLoad`) każdy plik SVG jest renderowany raz na niewidoczne płótno (`canvas`), a w pętli gry rysujemy te bitmapy (`sprites.*`).
- **Nie zmieniaj tego** na raw SVG drawing, bo gra straci płynność.

### 2. Audio System (Synthesized)
- Nie używamy plików MP3/WAV (brak w repozytorium).
- **Rozwiązanie:** Moduł `src/Audio.js` generuje dźwięki (SFX) w locie za pomocą **Web Audio API**.
- Wymaga interakcji użytkownika (kliknięcia) do aktywacji Contextu.

### 3. Equipment & Stats System
- Gracz ma sloty: head, chest, mainhand, offhand, legs.
- Przedmioty w `state.player.equipment` modyfikują statystyki (STR, DEX, INT, HP) w czasie rzeczywistym.
- Logika zamiany przedmiotów (swap) zaimplementowana w `src/UI.js`.

### 2. Renderowanie Sceny (Z-Sorting)
- Nie rysujemy obiektów wewnątrz pętli kafelków (`for x for y`).
- **Rozwiązanie:** Funkcja `drawScene` działa dwuetapowo:
    1. Rysuje podłogę i ściany (tło).
    2. Zbiera wszystkie ruchome obiekty (Gracz, Wrogowie, Loot) do listy `renderList`.
    3. Sortuje listę według współrzędnej Y (`ySort`).
    4. Rysuje obiekty od najdalszego do najbliższego.
- To zapobiega błędom przenikania i "sztywności" animacji.

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