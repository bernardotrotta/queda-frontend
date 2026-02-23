// Definisce la struttura di un singolo ticket presente nel database 
export interface QueueItem {
    _id: string;
    queueId: string; // Riferimento all'ID della coda di appartenenza 
    ticket: number; // Numero progressivo assegnato all'utente 
    payload: {
        username?: string; // Può contenere il nome utente o altri dati extra 
        [key: string]: any;
    };
    status: 'waiting' | 'serving' | 'served'; // Stato attuale del ticket nella coda 
    createdAt: string;
    updatedAt: string;
}

// Rappresenta i dati della coda gestita dall'organizzatore 
export interface Queue {
    _id: string;
    name: string; // Nome assegnato alla sessione della coda 
    ownerId: string; // Identificativo dell'utente che ha creato la coda 
    active: boolean; // Indica se la coda è attualmente aperta o chiusa 
    createdAt: string;
    updatedAt: string;
}