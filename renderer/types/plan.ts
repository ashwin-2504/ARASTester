export interface ActionParams {
  [key: string]: any;
}

export interface Action {
  actionID: string;
  actionTitle: string;
  actionType: string;
  isEnabled?: boolean;
  params: ActionParams;
}

export interface Test {
  testID: string;
  testTitle: string;
  isEnabled?: boolean;
  testActions: Action[];
}

export interface TestPlan {
  title: string;
  description?: string;
  created: string;
  updated: string;
  testPlan: Test[];
  __id?: string;
  __filename?: string;
}

export interface ActionSchemaField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'textarea' | 'select' | 'checkbox' | 'keyvalue' | 'json';
  required?: boolean;
  default?: any;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  prefix?: string;
  suffix?: string;
}

export interface ActionSchema {
  type: string;
  label: string;
  description?: string;
  category?: string;
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST';
  isClientSide?: boolean;
  fields: ActionSchemaField[];
}

export interface ActionPlugin {
  type: string;
  label: string;
  category?: string;
  description?: string;
  apiEndpoint?: string;
  apiMethod?: string;
  isClientSide?: boolean;
  defaultParams: Record<string, any>;
  Editor: React.ComponentType<any>;
  schema: ActionSchema;
}
