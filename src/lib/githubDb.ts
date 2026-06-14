import { Octokit } from '@octokit/rest';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// Interfaces for our data schemas
export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  address: string;
  lat: number;
  lng: number;
  role: 'patient' | 'doctor' | 'admin';
  phone: string;
}

export interface Clinic {
  clinic_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  specialties: string; // Separated by semicolon
}

export interface Doctor {
  doctor_id: string;
  name: string;
  clinic_id: string;
  specialty: string;
  symptoms_handled: string; // Separated by semicolon
  work_hours: string; // e.g. "08:00-17:00"
}

export interface Appointment {
  appointment_id: string;
  user_id: string;
  patient_name: string;
  patient_email: string;
  doctor_id: string;
  clinic_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_minutes: number;
  status: 'confirmed' | 'cancelled';
  symptom: string;
}

// Config details
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_OWNER = process.env.GITHUB_OWNER;

const isGitHubConfigured = !!(GITHUB_TOKEN && GITHUB_REPO && GITHUB_OWNER && GITHUB_TOKEN !== 'your_github_personal_access_token_here');

// Initialize Octokit client
const octokit = isGitHubConfigured ? new Octokit({ auth: GITHUB_TOKEN }) : null;

// Local DB directory (for fallback)
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Utility to parse numbers properly
 */
function castValues(file: string, row: any): any {
  const parsed = { ...row };
  
  // Cast specific fields to numbers
  if (file === 'users.csv' || file === 'clinics.csv') {
    if (parsed.lat !== undefined) parsed.lat = parseFloat(parsed.lat) || 0;
    if (parsed.lng !== undefined) parsed.lng = parseFloat(parsed.lng) || 0;
  }
  
  if (file === 'appointments.csv') {
    if (parsed.duration_minutes !== undefined) parsed.duration_minutes = parseInt(parsed.duration_minutes, 10) || 30;
  }

  return parsed;
}

/**
 * Reads CSV data from GitHub or Local filesystem
 */
export async function readCSV<T>(fileName: string): Promise<T[]> {
  const filePath = `data/${fileName}`;

  if (isGitHubConfigured && octokit) {
    try {
      const response = await octokit.rest.repos.getContent({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        path: filePath,
        // Bypass GitHub cache to get latest data
        headers: { 'If-None-Match': '' }
      });

      if ('content' in response.data) {
        const csvString = Buffer.from(response.data.content, 'base64').toString('utf8');
        const parsed = Papa.parse(csvString, {
          header: true,
          skipEmptyLines: true
        });
        return parsed.data.map((row: any) => castValues(fileName, row)) as T[];
      }
    } catch (error: any) {
      console.error(`Error reading ${fileName} from GitHub:`, error.message || error);
      // If file not found, we can try to fall back to local if it exists, or return empty array
    }
  }

  // Fallback to local filesystem
  try {
    const localPath = path.join(LOCAL_DATA_DIR, fileName);
    if (fs.existsSync(localPath)) {
      const csvString = fs.readFileSync(localPath, 'utf8');
      const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true
      });
      return parsed.data.map((row: any) => castValues(fileName, row)) as T[];
    }
  } catch (error) {
    console.error(`Error reading ${fileName} locally:`, error);
  }

  return [];
}

/**
 * Writes CSV data to GitHub or Local filesystem with automatic SHA update
 */
export async function writeCSV<T>(fileName: string, data: T[]): Promise<void> {
  const filePath = `data/${fileName}`;
  const csvContent = Papa.unparse(data, { header: true });

  if (isGitHubConfigured && octokit) {
    // Retry mechanism (up to 3 times) to resolve Git 409 conflicts
    let attempts = 3;
    while (attempts > 0) {
      try {
        let sha: string | undefined;

        // 1. Fetch latest SHA to avoid conflict
        try {
          const contentRes = await octokit.rest.repos.getContent({
            owner: GITHUB_OWNER!,
            repo: GITHUB_REPO!,
            path: filePath,
            headers: { 'If-None-Match': '' } // bypass cache
          });
          if ('sha' in contentRes.data) {
            sha = contentRes.data.sha;
          }
        } catch (err: any) {
          // File might not exist yet, which is fine
          if (err.status !== 404) {
            throw err;
          }
        }

        // 2. Write content
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          path: filePath,
          message: `Update ${fileName} via MediBuk App`,
          content: Buffer.from(csvContent, 'utf8').toString('base64'),
          sha: sha
        });
        
        console.log(`Successfully wrote ${fileName} to GitHub!`);
        return;
      } catch (error: any) {
        attempts--;
        console.warn(`Write attempt failed for ${fileName} (${attempts} attempts left). Error:`, error.message || error);
        if (attempts === 0) {
          throw new Error(`Failed to write to GitHub after multiple attempts: ${error.message || error}`);
        }
        // Wait 500ms before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // Fallback to local filesystem
  try {
    const localPath = path.join(LOCAL_DATA_DIR, fileName);
    fs.writeFileSync(localPath, csvContent, 'utf8');
    console.log(`Successfully wrote ${fileName} locally!`);
  } catch (error) {
    console.error(`Error writing ${fileName} locally:`, error);
    throw new Error(`Local write error: ${error}`);
  }
}
