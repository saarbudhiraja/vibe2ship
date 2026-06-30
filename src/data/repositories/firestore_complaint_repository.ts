import { db } from '../../lib/firebase';
import { MockComplaint, MockComment } from '../../components/ComplaintReportingSimulator';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  arrayUnion
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
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error in ComplaintRepo: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class FirestoreComplaintRepository {
  private collectionName = 'complaints';

  constructor() {}

  // Real-time listener pattern
  subscribe(callback: (complaints: MockComplaint[]) => void): () => void {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, orderBy('timestamp', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: MockComplaint[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as MockComplaint);
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, this.collectionName);
      }
    );
  }

  private cleanObject(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = this.cleanObject(val);
        }
      }
      return cleaned;
    }
    return obj;
  }

  async createComplaint(complaint: MockComplaint): Promise<void> {
    const docRef = doc(db, this.collectionName, complaint.id);
    try {
      const cleaned = this.cleanObject(complaint);
      await setDoc(docRef, cleaned);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${this.collectionName}/${complaint.id}`);
    }
  }

  async seedDefaultComplaints(): Promise<void> {
    const defaultComplaints: MockComplaint[] = [
      {
        id: 'compl_road_01',
        title: 'Severe Cracks & Potholes near Outer Ring Road Junction',
        description: 'Large fissure and multiple deep potholes formed on the main carriage way of Outer Ring Road, causing high risk of accidents for two-wheelers during peak traffic.',
        category: 'roads',
        location: {
          lat: 12.9716,
          lng: 77.5946,
          geohash: 'tdr1w7',
          accuracy: 5.2
        },
        media: [
          {
            type: 'image',
            path: 'images/pothole_seed.jpg',
            url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600'
          }
        ],
        status: 'in_progress',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        priority: 'high',
        severityScore: 78,
        assignedDept: 'Department of Public Works & Engineering',
        assignedEngineerName: 'Ravi Kumar',
        slaDeadline: new Date(Date.now() + 3600000 * 12).toISOString(), // 12 hours from now
        comments: [
          {
            id: 'comm_sys_01',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Complaint successfully submitted and analyzed by Gemini AI. Routed to Department of Public Works & Engineering.',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            type: 'system_alert'
          },
          {
            id: 'comm_sys_02',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Dispatch accepted. Field Engineer Ravi Kumar marked on-site and commenced remediation.',
            timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
            type: 'status_change'
          }
        ],
        timeline: {
          reportedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          assignedAt: new Date(Date.now() - 3600000 * 22).toISOString()
        }
      },
      {
        id: 'compl_water_02',
        title: 'High-Pressure Water Main Pipeline Leak near 100ft Road',
        description: 'Clean drinking water gushing out onto the road due to a burst municipal supply pipeline. Flooding the nearby pedestrian footpath.',
        category: 'water',
        location: {
          lat: 12.9784,
          lng: 77.6408,
          geohash: 'tdr1zp',
          accuracy: 4.1
        },
        media: [
          {
            type: 'image',
            path: 'images/water_leak_seed.jpg',
            url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600'
          }
        ],
        status: 'resolved',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
        priority: 'critical',
        severityScore: 92,
        assignedDept: 'Municipal Water Board & Sewers',
        assignedEngineerName: 'Ravi Kumar',
        workNotes: 'Replaced cracked 4-inch PVC joint using heavy duty rubber gasket. Water pressure normalized.',
        completionPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600',
        comments: [
          {
            id: 'comm_sys_03',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Complaint submitted. Routed to Municipal Water Board & Sewers.',
            timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
            type: 'system_alert'
          },
          {
            id: 'comm_sys_04',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Field worker marked remediation completed. Resolution: "Replaced cracked 4-inch PVC joint using heavy duty rubber gasket. Water pressure normalized.". Photo proof uploaded.',
            timestamp: new Date(Date.now() - 3600000 * 42).toISOString(),
            type: 'resolution_summary'
          }
        ],
        timeline: {
          reportedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          assignedAt: new Date(Date.now() - 3600000 * 47).toISOString(),
          resolvedAt: new Date(Date.now() - 3600000 * 42).toISOString()
        }
      },
      {
        id: 'compl_light_03',
        title: 'Broken Streetlights causing darkness across Jayanagar Metro',
        description: 'Entire stretch of 4th Block Jayanagar near the metro station is pitch black at night due to 5 consecutive non-functional LED lamp posts, creating safety concerns for women and elderly.',
        category: 'lighting',
        location: {
          lat: 12.9307,
          lng: 77.5830,
          geohash: 'tdr1v4',
          accuracy: 6.0
        },
        media: [],
        status: 'submitted',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        priority: 'medium',
        severityScore: 48,
        assignedDept: 'Electrical Utility Grid Services',
        comments: [
          {
            id: 'comm_sys_05',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Complaint submitted. Routed to Electrical Utility Grid Services.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            type: 'system_alert'
          }
        ],
        timeline: {
          reportedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      },
      {
        id: 'compl_sani_04',
        title: 'Unattended Illegal Garbage Dump on Indiranagar Footpath',
        description: 'Large pile of household garbage and commercial waste dumped illegally on the footpath. Emitting foul odor and attracting stray dogs/rodents.',
        category: 'sanitation',
        location: {
          lat: 12.9648,
          lng: 77.6430,
          geohash: 'tdr1zg',
          accuracy: 7.5
        },
        media: [],
        status: 'accepted',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        priority: 'medium',
        severityScore: 35,
        assignedDept: 'Sanitation & Solid Waste Management',
        comments: [
          {
            id: 'comm_sys_06',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Complaint submitted. Routed to Sanitation & Solid Waste Management.',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            type: 'system_alert'
          },
          {
            id: 'comm_sys_07',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Supervisor accepted ticket and authorized remediation.',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            type: 'status_change'
          }
        ],
        timeline: {
          reportedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          assignedAt: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      },
      {
        id: 'compl_safe_05',
        title: 'Exposed High-Voltage Live Wires on Pedestrian Pathway',
        description: 'BESCOM junction panel door is broken open with high voltage cables hanging out onto the wet footpath. Extremely hazardous, especially during current monsoon showers.',
        category: 'safety',
        location: {
          lat: 12.9738,
          lng: 77.6119,
          geohash: 'tdr1yf',
          accuracy: 3.2
        },
        media: [],
        status: 'escalated',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
        priority: 'critical',
        severityScore: 95,
        assignedDept: 'Local Disaster Response & Civil Defense',
        comments: [
          {
            id: 'comm_sys_08',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Complaint submitted. Routed to Local Disaster Response & Civil Defense.',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            type: 'system_alert'
          },
          {
            id: 'comm_sys_09',
            senderName: 'Civora System',
            senderRole: 'system',
            body: 'Supervisor escalated ticket to Higher Executive Authority due to critical municipal priority.',
            timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
            type: 'system_alert'
          }
        ],
        timeline: {
          reportedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          escalatedAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
        }
      }
    ];

    for (const compl of defaultComplaints) {
      await this.createComplaint(compl);
    }
  }

  async updateComplaint(id: string, changes: Partial<MockComplaint>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    try {
      const cleaned = this.cleanObject(changes);
      await updateDoc(docRef, cleaned);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${id}`);
    }
  }

  async addComment(complaintId: string, comment: MockComment): Promise<void> {
    const docRef = doc(db, this.collectionName, complaintId);
    try {
      await updateDoc(docRef, {
        comments: arrayUnion(comment)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${complaintId}`);
    }
  }

  async deleteComplaint(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }
}

export const firestoreComplaintRepository = new FirestoreComplaintRepository();
