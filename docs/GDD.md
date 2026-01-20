# Aethelgard - Game Design Document (GDD)

## 1. Opis Ogólny
Gra RPG akcji (ARPG) typu "Nieskończony Dungeon Crawler" w rzucie izometrycznym, osadzona w świecie dark fantasy. Gracz eksploruje proceduralnie generowane poziomy, schodząc coraz głębiej.

## 2. Mechanika Walki
- **System:** Point & Click (jak Diablo 1).
- **Atak:** Kliknięcie LPM na wroga zadaje obrażenia.
- **Śmierć wroga:** Wróg znika i zostawia mieszek (Loot Bag).

## 3. System Ekwipunku i Przedmiotów
- **Loot:** Przedmioty wypadają w workach na ziemi. Gracz musi podejść i kliknąć, aby otworzyć okno lootowania.
- **Plecak:** Grid 5x4 (20 slotów).
- **Typy przedmiotów:**
    - *Consumables:* Mikstury (odnawiają HP/MP, znikają po użyciu).
    - *Equipment:* Miecze, Zbroje - zwiększają statystyki.

## 4. Postać i Statystyki
- **HP (Zdrowie):** Gdy spadnie do 0, gra się kończy.
- **MP (Mana):** Regeneruje się powoli w czasie.
- **Statystyki:** Siła, Zręczność, Inteligencja.

## 5. Grafika
- Styl: Wektorowy (SVG) stylizowany na "Dark Fantasy" z elementami rysowanymi ręcznie (JPG).
- Widok: Izometryczny 2.5D.
- Środowisko: Zróżnicowane biomy (Lasy, Jeziora, Ruiny, Pustkowia).
- Cieniowanie: Dynamiczne cienie pod postaciami i Z-sorting dla obiektów.

## 6. Sterowanie
- Mysz (PC): Ruch, Atak, Interakcja z UI.
- Dotyk (Mobile): Tap-to-move (zgodność z mechaniką myszy).

## 7. Struktura Świata
- **Generacja:** Każdy poziom jest generowany proceduralnie (losowy układ ścian, wody, drzew).
- **Biomy:** System obsługuje różne biomy (np. Wymiar Uytek z 30% szansą na wystąpienie, charakteryzujący się unikalną kolorystyką i armią specyficznych wrogów).
- **Progresja:** Aby przejść dalej, gracz musi znaleźć Schody (zazwyczaj w rogu mapy).
- **Trudność:** Z każdym poziomem wrogowie (Szkielety, Pająki, Bossowie) mają więcej HP i zadają większe obrażenia.