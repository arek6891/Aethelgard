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
    - *Throwable:* Kartki z ocenami - można je rzucać we wrogów (kliknij w ekwipunku, potem na mapie).

## 3a. Bossowie
### Eloryba3000
- **Spawn:** Wyskakuje z wody (jezior na mapie).
- **Atak:** Rzuca kartkami z ocenami (1, 2, 3, 4, 5, 6, nb) w gracza.
- **Drop:** Łuska EloRyby (+100 HP) lub Stos Kartek (5 użyć, 20-30 obrażeń).
- **Mechanika:** Gracz może podnieść kartki i sam rzucać nimi we wrogów!

### Uytek
- **Spawn:** Pojawia się w Biomie Uytek (30% szans na biom).
- **Atak:** Woła pobliskie moby (w promieniu 10 tile) do ataku na gracza.
- **Efekt:** Fioletowa fala rozchodzi się od bossa gdy woła sojuszników.
- **Drop:** Włócznia Uyteka (+15 STR, +5 DEX) + **2 Fioletowe Klejnoty** (wartość 100 złota każdy).

## 4. Postać i Statystyki
- **HP (Zdrowie):** Gdy spadnie do 0, gra się kończy.
- **MP (Mana):** Regeneruje się powoli w czasie (+1 MP/s). Używana do aktywacji umiejętności.
- **Statystyki:** Siła, Zręczność, Inteligencja.

## 5. System Umiejętności (Skills)
Gracz posiada 3 aktywne umiejętności aktywowane klawiszami Q, W, E:
- **Q - Kula Ognia (Fireball):** Koszt 15 MP, cooldown 2s. Eksplozja obszarowa w punkcie kliknięcia.
- **W - Mróz (Frost Nova):** Koszt 20 MP, cooldown 4s. AoE wokół gracza, spowalnia wrogów na 3s.
- **E - Błyskawica (Lightning):** Koszt 25 MP, cooldown 5s. Potężne uderzenie z łańcuchem do 3 wrogów.

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
- **Biomy:** System obsługuje różne biomy z unikalnymi kolorami i wrogami:
  - **Normal (45%)** - zielona trawa, zwykłe drzewa, Szkielety i Pająki
  - **Uytek (30%)** - niebieska trawa, żółte drzewa, armia Uyteków
  - **Inferno (25%)** - czerwona trawa, spalone drzewa, lawowe jeziora, Demony i Władca Ognia
- **Progresja:** Aby przejść dalej, gracz musi znaleźć Schody (zazwyczaj w rogu mapy).
- **Trudność:** Z każdym poziomem wrogowie mają więcej HP i zadają większe obrażenia.

### Biom Inferno (Piekielny)
- **Kolorystyka:** Czerwono-brązowa trawa, spalone ciemne drzewa, rozżarzone skały
- **Woda → Lawa:** Jeziora zamienione na płynącą lawę
- **Moby:** Demony (60%), Płomienne Szkielety (40%)
- **Boss:** Władca Ognia - 100+ HP, drop: Piekielny Miecz (+20 STR, +5 INT) + Eliksir Ognia