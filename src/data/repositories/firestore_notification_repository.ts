import { NotificationRepository } from '../../domain/repositories/notification_repository';
import { NotificationEntity } from '../../domain/entities/notification';
import { db } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class FirestoreNotificationRepository implements NotificationRepository {
  private collectionName = 'notifications';

  constructor() {}

  // Real-time listener pattern
  subscribe(callback: (notifications: NotificationEntity[]) => void): () => void {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const notifs: NotificationEntity[] = [];
        snapshot.forEach((doc) => {
          notifs.push(doc.data() as NotificationEntity);
        });
        callback(notifs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, this.collectionName);
      }
    );
  }

  async getNotifications(role: 'citizen' | 'authority'): Promise<NotificationEntity[]> {
    try {
      const colRef = collection(db, this.collectionName);
      const snap = await getDocs(colRef);
      const list: NotificationEntity[] = [];
      snap.forEach(doc => {
        const data = doc.data() as NotificationEntity;
        if (data.recipientRole === role) {
          list.push(data);
        }
      });
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, notificationId);
    try {
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${notificationId}`);
    }
  }

  async markAllAsRead(role: 'citizen' | 'authority'): Promise<void> {
    try {
      const colRef = collection(db, this.collectionName);
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      let updatedCount = 0;

      snap.forEach(document => {
        const data = document.data() as NotificationEntity;
        if (data.recipientRole === role && !data.isRead) {
          batch.update(doc(db, this.collectionName, document.id), { isRead: true });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.collectionName);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, notificationId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${notificationId}`);
    }
  }

  async sendNotification(notification: Omit<NotificationEntity, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationEntity> {
    const newId = `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const newNotif: NotificationEntity = {
      ...notification,
      id: newId,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, this.collectionName, newId), newNotif);

      // Trigger HTML5 local notification where supported
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(newNotif.title, { body: newNotif.body });
        } catch (e) {
          console.error('Error showing web notification:', e);
        }
      }

      return newNotif;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${this.collectionName}/${newId}`);
    }
  }
}

export const firestoreNotificationRepository = new FirestoreNotificationRepository();
