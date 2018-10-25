export interface StatRequest {
  [statName: string]: string[] | undefined;
}

export interface StatResponse {
  [statName: string]: string[] | number[] | { [keyword: string]: number } | any; // TODO Remove "any," just for testing"
}

export interface SettingResponse {
  settings: Setting[];
  status: string;
  message: string;
}

export interface Setting {
  name: string;
  value: string;
}

export interface AppListResponse {
  appList: App[];
  status: string;
  message: string;
}

export interface App {
  name: string;
  store: string;
  appId: string;
}

export interface AppInfo {
  minDate: string;
  maxDate: string;
  versions: string[];
}

export interface Keyword {
  keyword: string;
  percentage: number;
}
