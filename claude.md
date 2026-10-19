# FLOW — specifica di progetto

FLOW è un tool online in stile Trello, personale e con meno funzioni. Serve a gestire i progetti con i clienti: ogni progetto ha la sua bacheca.

**Versione attuale: beta personale.** La usa solo il proprietario. La condivisione con i clienti arriva in una fase successiva (vedi sezione 9).

---

## 1. Obiettivo

- Organizzare il lavoro per progetto o cliente con un sistema a colonne.
- Separare chiaramente cosa devo fare io, cosa aspetto dal cliente e cosa è concluso.
- Restare minimale: poche funzioni, fatte bene, con grande cura tipografica.
- Usarlo sia da computer sia da telefono, con i dati sincronizzati tra i due.

## 2. Accesso (beta)

- Un solo utente: il proprietario.
- Accesso protetto da **una password**, salvata come variabile d'ambiente su Vercel (`FLOW_PASSWORD`).
- Dopo il login, un cookie di sessione sicuro (httpOnly) mantiene l'accesso per 30 giorni su quel dispositivo.
- Nessuna registrazione, nessuna email, nessun servizio di autenticazione esterno.
- Senza login, tutte le pagine e le API rispondono con la schermata di accesso.

## 3. Struttura

### 3.1 Bacheche
- Più bacheche, una per progetto o cliente.
- Ogni bacheca ha un titolo modificabile (direttamente dal titolo grande in cima alla bacheca). La data di creazione è salvata ma non mostrata.
- **Pagina iniziale "Bacheche"**: in alto la scritta FLOW e il titolo grande "Bacheche"; sotto, una griglia di riquadri bianchi, uno per bacheca (una colonna su telefono).
  - Ogni riquadro mostra **solo il nome** e, se ci sono, i segnali urgenti: "1 scaduta" in rosso, "2 in scadenza" in arancione (stessa regola della vista essenziale).
  - Toccando il riquadro si apre la bacheca; "‹ Bacheche" in alto a sinistra riporta qui.
  - Il "…" sul riquadro (visibile passandoci sopra) contiene **Elimina bacheca**, con avviso di conferma.
  - L'ultimo riquadro, tratteggiato, è **+ Nuova bacheca**: crea la bacheca con le tre colonne fisse e la apre subito, con il titolo pronto da scrivere.

### 3.2 Colonne
Ogni bacheca nasce con tre colonne fisse:

1. **In corso**: lavoro in corso.
2. **In revisione**: lavoro consegnato, in attesa della revisione del cliente.
3. **Fatto**: cose concluse.

A queste si aggiungono **una o più colonne variabili**:
- titolo libero e modificabile (esempi: "Stand by", "Perpetue");
- si possono aggiungere, rinominare, riordinare ed eliminare;
- le tre colonne fisse non si eliminano, ma il loro titolo è modificabile come quello delle altre.

### 3.3 Schede
Ogni scheda contiene sempre:

- **Titolo** (obbligatorio)
- **Descrizione**: testo con formattazione semplice, come su Trello: titolo e sottotitolo, grassetto, corsivo, barrato, sottolineato, elenchi puntati e numerati, link. Niente immagini né file.
- **Messaggi**: conversazione sulla scheda. Nella beta serve come diario; con la condivisione (sezione 9) diventa la chat con il cliente.
  - Ogni messaggio mostra in alto, come su Trello, iniziali e **nome di chi scrive** in evidenza, con data e ora; sotto, il testo in un riquadro leggero (azzurrino per i propri messaggi).
  - Il testo si può formattare come la descrizione, ma senza titoli: grassetto, corsivo, barrato, sottolineato, elenchi, link. La barra di formattazione si apre con il pulsante **Aa** accanto al campo; le scorciatoie funzionano anche a barra chiusa.
  - **Invio va a capo**; si spedisce con il pulsante blu o con Cmd+Invio, così non parte mai un messaggio a metà.
  - Sotto i **propri** messaggi ci sono **Modifica · Elimina** (sul computer compaiono passandoci sopra). Modifica apre il testo con la stessa barra di formattazione, Salva e Annulla; un messaggio modificato mostra "modificato" accanto all'ora. Elimina chiede conferma. I messaggi del cliente non si possono modificare.

E, solo se aggiunti, questi **moduli**:

- **Checklist**: elementi da spuntare, con l'avanzamento visibile sulla scheda (es. 2/5)
- **Link**: uno o più link, con titolo opzionale
- **Scadenza**: una data, con evidenza visiva se vicina (arancione) o passata (rosso)
- **Etichette colore**: per cliente, priorità o tipo di lavoro. Ogni bacheca ha il suo set di etichette.
- **Membri**: le persone coinvolte nella scheda

**Niente allegati.** Non si caricano file: solo link esterni.

#### Scheda in colonna
Ogni bacheca ha due viste, scelte con l'icona a forma di occhio in alto a destra:

- **Essenziale** (predefinita): la scheda mostra **solo il titolo**. Compare in più solo la scadenza quando è vicina (arancione) o passata (rosso). Niente etichette, icone, conteggi o membri.
- **Completa**: etichette, scadenza, avanzamento della checklist, icone di descrizione, link e messaggi, iniziali dei membri.

#### Dettaglio della scheda
Aprendo una scheda si vede, dall'alto in basso:

1. il **titolo**;
2. sotto, a sinistra il **contenuto della sezione scelta** e **a destra una barra laterale** con le sezioni in elenco (icona, nome e un riassunto a destra: numero di messaggi, avanzamento della checklist, data di scadenza, pallini delle etichette, iniziali dei membri): *Descrizione*, *Messaggi*, poi i moduli aggiunti; in fondo, dopo una linea, **+ Moduli**;
3. su telefono la barra resta a destra ma chiusa, come **striscia di sole icone**; l'icona in cima la **apre** mostrando anche nomi e riassunti, e aprendosi **spinge il contenuto verso sinistra** (effetto push). Toccando una sezione o il contenuto si richiude. Non c'è una seconda schermata.

Regole dei moduli:

- **+ Moduli** apre un menu a tendina con tutti i moduli e una spunta accanto a quelli visibili.
- **Spuntare** un modulo lo mostra. **Togliere la spunta lo nasconde ma non ne cancella il contenuto**: rimettendo la spunta torna com'era. Nel menu, accanto a un modulo nascosto con contenuto, compare un'indicazione grigia (es. "5 elementi").
- Un modulo nascosto non compare da nessuna parte, nemmeno sulla scheda in colonna: una scadenza nascosta non dà avvisi.
- **Eliminare** un modulo si fa dal menu "…" della scheda (in alto a destra): mostra **Elimina [nome della sezione aperta]** sopra *Elimina scheda*. Non ci sono altri "…" nelle sezioni. Se il modulo ha contenuto, un avviso chiede conferma dicendo cosa si perde (es. "I 5 elementi verranno cancellati definitivamente"), con **Annulla** come scelta predefinita.
- La descrizione si legge già formattata; toccandola si apre la modifica, con una barra di formattazione (Tt▾ per i titoli, grassetto, corsivo▾ per gli altri stili, elenchi▾, link) e i pulsanti **Salva** e **Annulla**. Scrivere "- " o "1. " a inizio riga crea un elenco. Il testo incollato entra senza formattazione.
- La checklist è nello stile di Trello: barra di avanzamento con percentuale, quadratini da spuntare, elementi fatti barrati.
- In alto a destra ci sono due icone: **"…"** apre un menu con **Sposta in ›** (un sottomenu con l'elenco delle colonne e la spunta a destra su quella attuale), **Cambia colore ›** (solo nel tema Carta: sottomenu con i sei colori, pallino e nome; il colore attuale ha un anello intorno al pallino) ed **Elimina scheda** (in rosso, con avviso di conferma); **✕** chiude la scheda.

Azioni sulle schede:
- creare, modificare, eliminare;
- trascinare tra colonne e riordinare dentro la colonna, anche su telefono (tenendo premuta la scheda); in alternativa, "Sposta in" dal menu "…" della scheda aperta.

## 4. Design

- Minimalismo e tipografia curata sono il centro del progetto.
- **Stile di riferimento: sistema operativo Apple (iOS/macOS).** Molto pulito e leggibile:
  - font di sistema (SF Pro tramite `-apple-system` / `system-ui`, con alternative equivalenti sugli altri dispositivi);
  - superfici chiare e grigi leggeri, angoli morbidi, ombre quasi assenti;
  - la gerarchia nasce dalla tipografia, non da bordi o decorazioni.
- Scala tipografica definita e rispettata, con pochi pesi e una gerarchia chiara.
- Palette ridotta: il colore compare solo dove ha un significato (etichette, scadenze).
- Tema chiaro e scuro.
- Su telefono (tema Sistema) i testi seguono le misure di iOS: corpo 17, titolo della scheda 26 in grassetto. In entrambi i temi le icone ✕ e "…" sono grandi e facili da toccare, e la pagina non si ingrandisce da sola toccando un campo di testo.
- **Due temi grafici**, scelti dalla voce **Tema** in alto a destra nella pagina iniziale (la scelta vale per il singolo dispositivo):
  - **Sistema**: lo stile Apple descritto sopra.
  - **Carta**: come un planner stampato. Bianco e nero, linee sottili nere o grigie al posto di riquadri e ombre, titoli in **maiuscolo con spaziatura ampia**, carattere **Geologica** (Google Fonts, con latino esteso, cirillico e greco per eventuali traduzioni). Titoli di pagina centrati e in grassetto. Nella pagina iniziale ogni bacheca è un riquadro bianco con il bordo nero sottile ("+ Nuova bacheca" tratteggiato). Le schede sono **post-it**: blocchi di colore pieno in una palette di toni carta smorzati (beige, rosa antico, azzurro polvere, malva, salvia, pesca), senza linee, con una leggera ombra; ogni scheda ha sempre lo stesso colore (assegnato in automatico, oppure scelto nel menu "…" della scheda alla voce *Colore*), così si riconosce quando la sposti; la scheda aperta ha l'intestazione del suo colore e nessun bordo nero, e quelle in *Fatto* sono sbiadite; le colonne hanno il titolo centrato sopra una linea nera. Il colore resta solo dove ha un significato (scadenze, pallini delle etichette). Anche le voci dei menu sono in maiuscolo spaziato, come le sezioni.
- Responsive: deve funzionare bene **sia su computer sia su telefono**. Le colonne hanno larghezza fissa (come su Trello) e restano affiancate anche su telefono, dove scorrono in orizzontale. Le schede prendono la larghezza della colonna e l'altezza dal contenuto; i titoli non vengono mai tagliati.
- Date e scadenze nel fuso orario italiano (Europe/Rome).
- Interfaccia in italiano.

## 5. Stack

- **Next.js** (App Router, TypeScript)
- **Vercel**: hosting, piano gratuito Hobby. All'inizio l'indirizzo è `*.vercel.app`, poi passerà a un dominio personale.
- **Neon Postgres**: database, collegato tramite l'integrazione Vercel Marketplace (Vercel → Storage → Neon). Le variabili di collegamento vengono aggiunte da Vercel in automatico.
- **Drizzle ORM** per le query e le migrazioni.
- **@dnd-kit** per il trascinamento.
- Repository su **GitHub**, collegato a Vercel per la pubblicazione automatica a ogni modifica.

### Perché Neon e non Supabase
- Sul piano gratuito, Supabase mette in pausa il progetto dopo un periodo di inattività. Per riattivarlo bisogna intervenire a mano.
- Neon invece spegne il database dopo 5 minuti di inattività e lo **riaccende da solo** alla richiesta successiva. Al primo accesso dopo una pausa c'è solo una breve attesa.
- Il piano gratuito di Neon offre 1 GB per progetto, più che sufficiente per testo e link.

### Alternative scartate
- **Solo browser (localStorage)**: nessun servizio esterno, ma i dati restano su un solo dispositivo. Computer e telefono non si sincronizzerebbero.
- **Vercel Blob con un file JSON**: niente database, ma il piano gratuito include circa 2.000 scritture al mese, e con un salvataggio a ogni modifica è un limite troppo stretto.

## 6. Modello dati

```
boards          id, titolo, posizione, created_at
columns         id, board_id, titolo, tipo ('in_corso' | 'in_revisione' | 'fatto' | 'variabile'), posizione
labels          id, board_id, nome, colore
cards           id, column_id, board_id, titolo, descrizione, scadenza (date), moduli_visibili (elenco), posizione, created_at, updated_at
card_labels     card_id, label_id
card_members    card_id, membro
messages        id, card_id, autore, testo, created_at
checklist_items id, card_id, testo, completato, posizione
links           id, card_id, url, titolo, posizione
```

- La creazione di una bacheca crea anche le tre colonne fisse.
- L'eliminazione è a cascata: eliminando una bacheca si eliminano le sue colonne, schede, checklist e link.
- Per l'ordinamento, `posizione` usa numeri frazionari (o stringhe lexorank), così uno spostamento aggiorna una sola riga.
- Il modello è pensato per aggiungere gli utenti in seguito (sezione 9) senza riscriverlo.

## 7. Fasi

1. ✅ **Prototipo visivo** con dati di esempio, per definire tipografia e stile.
2. ✅ **Progetto Next.js** con login a password e database Neon collegato.
3. ✅ **Bacheche, colonne, schede** con le funzioni della sezione 3 (manca il riordino delle bacheche e delle colonne).
4. ✅ **Pubblicazione** su Vercel: https://flow-s3.vercel.app (progetto `flow`, si aggiorna a ogni modifica del ramo `main`).
5. **Dominio personale** (facoltativo).

## 8. Note per chi sviluppa

- Il proprietario **non è uno sviluppatore**. I passaggi che deve fare lui vanno spiegati in modo semplice, passo per passo: creazione del progetto su Vercel, collegamento di Neon, impostazione di `FLOW_PASSWORD`, dominio.
- Orari e date sempre nel fuso orario italiano (CET/CEST).
- Salvataggi immediati e ottimistici: l'interfaccia si aggiorna subito e salva in background. Se il salvataggio non riesce, lo segnala (avviso rosso in basso) e riprova.

### Com'è fatto il codice
- `ui/flow.html`: tutta l'interfaccia (HTML, CSS e JavaScript senza librerie). `ui/login.html`: la schermata di accesso.
- `scripts/build-ui.mjs` le avvolge in un documento completo e le scrive in `lib/ui-html.ts` (generato, non va modificato né salvato su Git); le route `app/route.ts` (`/`) e `app/login/route.ts` le restituiscono.
- `middleware.ts` + `lib/auth.ts`: senza il cookie di sessione (`flow_session`, firmato con `FLOW_PASSWORD`, 30 giorni) le pagine portano a `/login` e le API rispondono 401. Cambiando la password, tutti i dispositivi devono rientrare.
- API: `GET /api/state` (tutte le bacheche), `PUT /api/boards/:id` (salva una bacheca intera, in una transazione), `DELETE /api/boards/:id`, `POST /api/login`, `POST /api/logout`.
- `lib/schema.ts` (Drizzle) segue la sezione 6; le migrazioni stanno in `drizzle/` (`npm run db:generate` dopo una modifica allo schema) e vengono applicate da `scripts/migrate.mjs` a ogni pubblicazione su Vercel.
- Il database si legge da `DATABASE_URL` (o `POSTGRES_URL`), aggiunta da Vercel con l'integrazione Neon.
- L'interfaccia salva solo le bacheche cambiate e, tornando sulla pagina, ricarica i dati per vedere le modifiche fatte da un altro dispositivo. Se le API non esistono (anteprima senza server) salva nel browser.
- Prima di aprire FLOW ai clienti (sezione 9) va aggiunta la pulizia dell'HTML di descrizioni e messaggi lato server.

## 9. Dopo la beta: condivisione con i clienti

Quando FLOW sarà aperto ai clienti:
- ogni cliente vede **solo le bacheche a cui è invitato**, e lì può fare tutto;
- l'accesso avviene via email con link magico, ad esempio con Auth.js e un servizio email come Resend;
- al database si aggiungono le tabelle `users`, `board_members` e `invites`, e ogni query va filtrata per utente;
- il proprietario vede tutte le bacheche ed è l'unico che può eliminarle e gestire gli inviti.

## 10. Da decidere

- [x] Struttura del dettaglio della scheda (sezione 3.3)
- [x] Titolo delle colonne fisse modificabile: sì
- [ ] Set di etichette predefinito per le nuove bacheche
- [ ] Archivio delle schede in "Fatto" dopo un certo tempo, o restano lì
