import { create } from 'zustand';

interface UserState {
  // Web3 состояние
  tgId: string | null; // ID из Телеграма, который мы используем для всех запросов к бэкенду
  walletAddress: string | null;
  isVip: boolean;
  isUser: boolean; // Новое поле для проверки наличия пользователя в базе данных

  // Действия
  setTgId: (id: string) => void; // <--- ДОБАВИТЬ ЭТО
  connectWallet: (address: string) => Promise<{success: boolean, error?: string}>;
  disconnectWallet: () => Promise<boolean>;
  checkVipOnBackend: () => Promise<void>;
  checkUserInDatabase: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  tgId: null, // Заглушка для теста, потом заменим на реальный ID из Телеграма
  walletAddress: null,
  isVip: false,
  isUser: false,


  connectWallet: async (address: string) => {
    const tgId = get().tgId;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId, wallet_address: address })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        set({ walletAddress: address });
        return { success: true };
      } else {
        // Возвращаем текст ошибки, который нам прислал Питон!
        return { success: false, error: data.error || "Отклонено сервером" };
      }
      
    } catch (error) {
      console.error("Ошибка сети", error);
      return { success: false, error: "Сервер недоступен" };
    }
  },

  disconnectWallet: async () => {
    const tgId = get().tgId;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        set({ walletAddress: null });
        return true; // ✅ Питон дал добро!
      } else {
        console.error("❌ Бэкенд не смог отвязать кошелек:", data.error);
        return false; // ❌ Питон отказал!
      }
      
    } catch (error) {
      console.error("🌐 Ошибка сети при отключении кошелька:", error);
      return false; // ❌ Ошибка связи!
    }
  },

  checkVipOnBackend: async () => {
    console.log("checkVipOnBackend")
    const tgId = get().tgId;
    try {
      // Стучимся на бэкенд и передаем ему адрес кошелька
      // Заглушка для теста: жестко передаем id = "123456789". 
      // Потом заменим на реальный ID из Телеграма!
      const response = await fetch(`http://127.0.0.1:8000/api/wallet/status?tg_id=${tgId}`);
      if (!response.ok) throw new Error("Ошибка бэкенда");
      const data = await response.json();
      
      // Питон ответил! Записываем то, что он сказал (true или false)
      set({ walletAddress: data.wallet_address });
      
    } catch (error) {
      console.error("Бэкенд недоступен, статус VIP отклонен", error);
      // Если Питон упал или хакер обрезал интернет - строго даем false
      set({ walletAddress: null }); 
    }
  },

  // Добавляем саму функцию:
  setTgId: (id: string) => set({ tgId: id }),

  checkUserInDatabase: async () => {
    console.log("checkUserInDatabase")
    const tgId = get().tgId;
    if (!tgId) return; // Защита: если ID еще нет, ничего не делаем
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/user/status?tg_id=${tgId}`);
      if (!response.ok) throw new Error("Ошибка бэкенда");
      
      // Питон ответил! Записываем то, что он сказал (true или false)
      set({ isUser: true }); // Если пользователь найден в базе, ставим true
      
    } catch (error) {
      console.error("Бэкенд недоступен, статус пользователя отклонен", error);
      // Если Питон упал или хакер обрезал интернет - строго даем false
      set({ isUser: false }); 
    }
  }

}))