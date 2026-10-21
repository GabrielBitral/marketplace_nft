import type { StoredUser } from "./_store";

export type Account = StoredUser & { passwordHash: string; };

const initialAccounts: Account[] = [
  { name: "colecionador", email: "colecionador@kurio.io", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
  { name: "Conta existente", email: "existente@kurio.io", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
];

export const accounts = new Map(initialAccounts.map((account) => [account.email, { ...account }]));

export const resetAccounts = () => {
  accounts.clear();
  initialAccounts.forEach((account) => accounts.set(account.email, { ...account }));
};
