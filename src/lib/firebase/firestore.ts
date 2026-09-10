import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./client";
import type { Meal } from "@/types/meal";
import type { DailyLog, ExerciseLog } from "@/types/activity";

/**
 * Firestore Repository Service Layer for NutriTrack AI.
 * Handles dual-persistence operations (Meals, DailyLogs, Activities)
 * with robust error boundaries and non-blocking background execution.
 */

const DEFAULT_USER_ID = "user_demo_1";

/**
 * Saves or updates a meal document in Firestore.
 */
export async function saveMealToFirestore(meal: Meal): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const mealRef = doc(db, "meals", meal.id);
    const payload = {
      id: meal.id,
      userId: meal.userId || DEFAULT_USER_ID,
      date: meal.date,
      time: meal.time || "12:00",
      mealType: meal.type,
      mealName: meal.name,
      items: meal.items || [],
      totalCalories: meal.totalCalories || 0,
      totalProtein: meal.totalProtein || 0,
      totalCarbs: meal.totalCarbs || 0,
      totalFat: meal.totalFat || 0,
      imageUrl: meal.imageUrl || null,
      confidence: meal.aiConfidence || null,
      notes: meal.notes || null,
      createdAt: meal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(mealRef, payload, { merge: true });
  } catch (error) {
    console.error(`[NutriTrack AI] Error saving meal ${meal.id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Deletes a meal document from Firestore.
 */
export async function deleteMealFromFirestore(mealId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const mealRef = doc(db, "meals", mealId);
    await deleteDoc(mealRef);
  } catch (error) {
    console.error(`[NutriTrack AI] Error deleting meal ${mealId} from Firestore:`, error);
    throw error;
  }
}

/**
 * Saves or updates a daily log document in Firestore (document ID: YYYY-MM-DD).
 */
export async function saveDailyLogToFirestore(log: DailyLog): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const logRef = doc(db, "dailyLogs", log.date);
    const payload = {
      id: log.date,
      userId: DEFAULT_USER_ID,
      date: log.date,
      steps: log.steps || 0,
      stepGoal: log.stepGoal || 10000,
      waterMl: log.waterMl || 0,
      waterGoalMl: log.waterGoalMl || 2500,
      calorieGoal: log.calorieGoal || 2000,
      distanceKm: log.distanceKm || 0,
      activeMinutes: log.activeMinutes || 0,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(logRef, payload, { merge: true });
  } catch (error) {
    console.error(`[NutriTrack AI] Error saving daily log ${log.date} to Firestore:`, error);
    throw error;
  }
}

/**
 * Saves or updates an exercise activity document in Firestore.
 */
export async function saveActivityToFirestore(activity: ExerciseLog): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const actRef = doc(db, "activities", activity.id);
    const payload = {
      id: activity.id,
      userId: activity.userId || DEFAULT_USER_ID,
      date: activity.date,
      time: activity.time,
      type: activity.type,
      title: activity.title,
      durationMinutes: activity.durationMinutes || 0,
      estimatedCalories: activity.caloriesBurned || 0,
      createdAt: activity.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(actRef, payload, { merge: true });
  } catch (error) {
    console.error(`[NutriTrack AI] Error saving activity ${activity.id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Deletes an exercise activity document from Firestore.
 */
export async function deleteActivityFromFirestore(activityId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const actRef = doc(db, "activities", activityId);
    await deleteDoc(actRef);
  } catch (error) {
    console.error(`[NutriTrack AI] Error deleting activity ${activityId} from Firestore:`, error);
    throw error;
  }
}

/**
 * Fetches all user data from Firestore during cloud synchronization.
 * Returns null if Firebase is not configured or an error occurs.
 */
export async function fetchUserDataFromFirestore(
  userId: string = DEFAULT_USER_ID
): Promise<{
  meals: Meal[];
  dailyLogs: Record<string, DailyLog>;
  activities: ExerciseLog[];
} | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    // 1. Fetch Meals
    const mealsQuery = query(collection(db, "meals"), where("userId", "==", userId));
    const mealsSnap = await getDocs(mealsQuery);
    const meals: Meal[] = [];
    mealsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      meals.push({
        id: data.id || docSnap.id,
        userId: data.userId,
        date: data.date,
        time: data.time || "12:00",
        type: data.mealType,
        name: data.mealName,
        items: data.items || [],
        totalCalories: data.totalCalories || 0,
        totalProtein: data.totalProtein || 0,
        totalCarbs: data.totalCarbs || 0,
        totalFat: data.totalFat || 0,
        imageUrl: data.imageUrl || undefined,
        aiConfidence: data.confidence || undefined,
        notes: data.notes || undefined,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    // 2. Fetch Daily Logs
    const logsQuery = query(collection(db, "dailyLogs"), where("userId", "==", userId));
    const logsSnap = await getDocs(logsQuery);
    const dailyLogs: Record<string, DailyLog> = {};
    logsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const dateKey = data.date || docSnap.id;
      dailyLogs[dateKey] = {
        date: dateKey,
        steps: data.steps || 0,
        stepGoal: data.stepGoal || 10000,
        waterMl: data.waterMl || 0,
        waterGoalMl: data.waterGoalMl || 2500,
        calorieGoal: data.calorieGoal || 2000,
        distanceKm: data.distanceKm || 0,
        activeMinutes: data.activeMinutes || 0,
      };
    });

    // 3. Fetch Activities
    const actsQuery = query(collection(db, "activities"), where("userId", "==", userId));
    const actsSnap = await getDocs(actsQuery);
    const activities: ExerciseLog[] = [];
    actsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      activities.push({
        id: data.id || docSnap.id,
        userId: data.userId,
        date: data.date,
        time: data.time || "09:00",
        type: data.type,
        title: data.title,
        durationMinutes: data.durationMinutes || 0,
        caloriesBurned: data.estimatedCalories || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    return { meals, dailyLogs, activities };
  } catch (error) {
    console.error("[NutriTrack AI] Error fetching data from Firestore:", error);
    return null;
  }
}
