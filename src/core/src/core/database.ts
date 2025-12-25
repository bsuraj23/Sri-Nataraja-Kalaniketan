import { StudentFace, AttendanceRecord } from './faceEngine';

/**
 * Database abstraction layer for face enrollment and attendance data
 * Uses IndexedDB for larger data and localStorage for backup
 */
export class Database {
  private dbName = 'FaceAttendanceDB';
  private studentsStore = 'students';
  private attendanceStore = 'attendance';
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create students store
        if (!db.objectStoreNames.contains(this.studentsStore)) {
          const studentStore = db.createObjectStore(this.studentsStore, {
            keyPath: 'studentId',
          });
          studentStore.createIndex('name', 'name', { unique: false });
          studentStore.createIndex('enrolledAt', 'enrolledAt', { unique: false });
        }

        // Create attendance store
        if (!db.objectStoreNames.contains(this.attendanceStore)) {
          const attendanceStore = db.createObjectStore(this.attendanceStore, {
            keyPath: ['studentId', 'timestamp'],
          });
          attendanceStore.createIndex('studentId', 'studentId', { unique: false });
          attendanceStore.createIndex('sessionId', 'sessionId', { unique: false });
          attendanceStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Add or update a student enrollment
   */
  async addStudent(student: StudentFace): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.studentsStore], 'readwrite');
      const store = transaction.objectStore(this.studentsStore);
      const request = store.put(student);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get student by ID
   */
  async getStudent(studentId: string): Promise<StudentFace | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.studentsStore], 'readonly');
      const store = transaction.objectStore(this.studentsStore);
      const request = store.get(studentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get all students
   */
  async getAllStudents(): Promise<StudentFace[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.studentsStore], 'readonly');
      const store = transaction.objectStore(this.studentsStore);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete student
   */
  async deleteStudent(studentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.studentsStore], 'readwrite');
      const store = transaction.objectStore(this.studentsStore);
      const request = store.delete(studentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all students
   */
  async clearAllStudents(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.studentsStore], 'readwrite');
      const store = transaction.objectStore(this.studentsStore);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add attendance record
   */
  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.attendanceStore],
        'readwrite'
      );
      const store = transaction.objectStore(this.attendanceStore);
      const request = store.add(record);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get attendance records by student
   */
  async getAttendanceByStudent(
    studentId: string,
    limit: number = 100
  ): Promise<AttendanceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.attendanceStore],
        'readonly'
      );
      const store = transaction.objectStore(this.attendanceStore);
      const index = store.index('studentId');
      const request = index.getAll(studentId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.slice(-limit);
        resolve(results);
      };
    });
  }

  /**
   * Get attendance records by session
   */
  async getAttendanceBySession(
    sessionId: string
  ): Promise<AttendanceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.attendanceStore],
        'readonly'
      );
      const store = transaction.objectStore(this.attendanceStore);
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get attendance by date range
   */
  async getAttendanceByDateRange(
    startTime: number,
    endTime: number
  ): Promise<AttendanceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.attendanceStore],
        'readonly'
      );
      const store = transaction.objectStore(this.attendanceStore);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startTime, endTime);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Clear all attendance records
   */
  async clearAllAttendance(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.attendanceStore],
        'readwrite'
      );
      const store = transaction.objectStore(this.attendanceStore);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Export data to JSON
   */
  async exportData(): Promise<string> {
    const students = await this.getAllStudents();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const attendance = await this.getAttendanceByDateRange(
      startOfDay.getTime(),
      Date.now()
    );

    return JSON.stringify(
      {
        students,
        attendance,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Import data from JSON
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      // Import students
      if (Array.isArray(data.students)) {
        for (const student of data.students) {
          await this.addStudent(student);
        }
      }

      // Import attendance
      if (Array.isArray(data.attendance)) {
        for (const record of data.attendance) {
          await this.addAttendanceRecord(record);
        }
      }

      console.log('✓ Data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid data format for import');
    }
  }
}

export default Database;
