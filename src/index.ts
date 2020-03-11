import { firestoreGet, firestoreWrite, firestoreDelete } from './commands/firestore';
import { rtdbGet, rtdbWrite, rtdbRemove } from './commands/rtdb';
import createCustomToken from './commands/createCustomToken';

export {
  firestoreGet,
  firestoreWrite,
  firestoreDelete,
  rtdbGet,
  rtdbWrite,
  rtdbRemove,
  createCustomToken
}
