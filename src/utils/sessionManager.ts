/**
 * Session Manager - Manage attendance sessions and track marked students
 */

export interface AttendanceSession {
  sessionId: string;
  createdAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
  markedStudents: Set<string>;
  totalCaptured: number;
  className?: string;
  notes?: string;
}

export class SessionManager {
  private sessions: Map<string, AttendanceSession> = new Map();
  private activeSession: AttendanceSession | null = null;

  /**
   * Create a new attendance session
   */
  createSession(className?: string): AttendanceSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: AttendanceSession = {
      sessionId,
      createdAt: Date.now(),
      status: 'active',
      markedStudents: new Set(),
      totalCaptured: 0,
      className,
    };
    this.sessions.set(sessionId, session);
    this.activeSession = session;
    return session;
  }

  /**
   * End current active session
   */
  endSession(sessionId?: string): AttendanceSession | null {
    const session = sessionId ? this.sessions.get(sessionId) : this.activeSession;
    if (!session) return null;

    session.status = 'ended';
    session.endedAt = Date.now();
    if (this.activeSession?.sessionId === session.sessionId) {
      this.activeSession = null;
    }
    return session;
  }

  /**
   * Mark student as present in session
   */
  markStudent(studentId: string, sessionId?: string): boolean {
    const session = sessionId ? this.sessions.get(sessionId) : this.activeSession;
    if (!session || session.status === 'ended') return false;

    if (!session.markedStudents.has(studentId)) {
      session.markedStudents.add(studentId);
      session.totalCaptured++;
      return true;
    }
    return false;
  }

  /**
   * Get active session
   */
  getActiveSession(): AttendanceSession | null {
    return this.activeSession;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AttendanceSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): AttendanceSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get marked students in session
   */
  getMarkedStudents(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session.markedStudents) : [];
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      duration: session.endedAt ? session.endedAt - session.createdAt : Date.now() - session.createdAt,
      markedCount: session.markedStudents.size,
      totalCaptured: session.totalCaptured,
      status: session.status,
    };
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    if (this.activeSession?.sessionId === sessionId) {
      this.activeSession = null;
    }
    return this.sessions.delete(sessionId);
  }
}

export default SessionManager;
