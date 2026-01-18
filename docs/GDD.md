# Aethelgard - Game Design Document (GDD)

## 1. Opis Ogólny
Gra RPG akcji (ARPG) w rzucie izometrycznym, osadzona w świecie dark fantasy.

## 2. Mechanika Walki
- **System:** Point & Click (jak Diablo 1).
- **Atak:** Kliknięcie LPM na wroga zadaje obrażenia.
- **Śmierć wroga:** Wróg znika i zostawia mieszek (Loot Bag).

## 3. System Ekwipunku i Przedmiotów
- **Loot:** Przedmioty wypadają w workach na ziemi. Gracz musi podejść i kliknąć, aby otworzyć okno lootowania.
- **Plecak:** Grid 5x4 (20 slotów).
- **Typy przedmiotów:**
    - *Consumables:* Mikstury (odnawiają HP/MP, znikają po użyciu).
    - *Equipment:* (Planowane) Miecze, Zbroje - zwiększają statystyki.

## 4. Postać i Statystyki
- **HP (Zdrowie):** Gdy spadnie do 0, gra się kończy (do zaimplementowania ekran śmierci).
- **MP (Mana):** Regeneruje się powoli w czasie.
- **Statystyki:** Siła, Zręczność, Inteligencja (wpływają na obrażenia - do oprogramowania).

## 5. Grafika
- Styl: Wektorowy (SVG) stylizowany na "Dark Fantasy".
- Widok: Izometryczny 2.5D.
- Cieniowanie: Dynamiczne cienie pod postaciami (elipsy).

## 6. Sterowanie
- Mysz (PC): Ruch, Atak, Interakcja z UI.
- Dotyk (Mobile): Tap-to-move (zgodność z mechaniką myszy).