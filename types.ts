
export interface Instructor {
  name: string;
  role: string;
  signature: string; // Base64 image
}

export interface Company {
  id: string;
  name: string;
  cuit: string;
}

export interface TrainingItem {
  id: string;
  title: string;
  url: string;
}

export interface Training {
  id: string;
  title: string;
  items: TrainingItem[];
}

export interface Assignment {
  id: string;
  trainingId: string;
  companyId: string;
}

export interface Attendance {
  id: string;
  employeeName: string;
  employeeDni: string;
  employeeSignature: string; // Base64
  trainingId: string;
  companyId: string;
  timestamp: number;
}
