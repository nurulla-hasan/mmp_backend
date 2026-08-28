export interface IUserLocation {
  district: string;
  upazila: string;
}

export interface IPublicUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "SURVEYOR" | "ADMIN";
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  emailVerified: boolean;
  isSubscribed: boolean;
  imageUrl: string;
  phone: string | null;
  whatsappNumber: string | null;
  district: string;
  upazila: string;
  createdAt: Date | string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
}

export interface IAuthResponse extends IAuthTokens {
  user: IPublicUser;
}
