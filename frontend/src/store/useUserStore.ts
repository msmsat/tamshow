import { create } from 'zustand';

interface UserState {
  // Web3 состояние
  tgId: string | null; // 🔥 1. ВЕРНУЛИ СЮДА
  walletAddress: string | null;
  isVip: boolean;
  shippingAddress: string | null;
  internalBalance: number;

  // Действия
  connectWallet: (address: string) => Promise<{success: boolean, error?: string}>;
  disconnectWallet: () => Promise<boolean>;
  checkVipOnBackend: () => Promise<void>;
  saveShippingAddress: (address: string) => Promise<boolean>;
  fetchUserInfo: () => Promise<void>;
}

export const telegramInitData = window.Telegram?.WebApp?.initData || "";
const initialTgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id 
  ? String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id)
  : null;

export const useUserStore = create<UserState>((set) => ({
  tgId: initialTgId, // 🔥 3. ЗАПИСАЛИ СТАРТОВЫЙ ID
  walletAddress: null,
  isVip: false,
  shippingAddress: null,
  internalBalance: 0,


  fetchUserInfo: async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/profile/info`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        'Authorization': `tma ${telegramInitData}`
      }
    });
    const data = await response.json();
    if (data.success) {
      set({ 
        tgId: data.data.tg_id,
        internalBalance: data.data.balance,
        walletAddress: data.data.wallet,
        shippingAddress: data.data.address 
      });
    }
  } catch (err) {
    console.error("Error fetching info:", err);
  }},

  saveShippingAddress: async (address: string) => {
    try {
      // Замени URL на тот, который мы прописали в profile.py
      const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/profile/update_address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true",
          'Authorization': `tma ${telegramInitData}`
        },
        body: JSON.stringify({address: address })
      });

      if (response.ok) {
        // Успех! Записываем адрес в Zustand
        set({ shippingAddress: address }); 
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Ошибка при сохранении адреса:", error);
      return false;
    }
  },

  connectWallet: async (address: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/wallet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true",
          'Authorization': `tma ${telegramInitData}`
        },
        body: JSON.stringify({ wallet_address: address })
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
    try {
      const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/wallet/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true",
          'Authorization': `tma ${telegramInitData}`
        }
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
    try {
      // Стучимся на бэкенд и передаем ему адрес кошелька
      // Заглушка для теста: жестко передаем id = "123456789". 
      // Потом заменим на реальный ID из Телеграма!
      const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/wallet/status`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          'Authorization': `tma ${telegramInitData}`
        }
      });
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

}))