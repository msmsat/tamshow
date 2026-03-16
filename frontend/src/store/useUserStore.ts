import { create } from 'zustand';

interface UserState {
  // Web3 состояние
  walletAddress: string | null;
  isVip: boolean;

  // Действия
  connectWallet: (tgId: string, address: string) => Promise<{success: boolean, error?: string}>;
  disconnectWallet: (tgId: string) => Promise<boolean>;
  checkVipOnBackend: (tgId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  walletAddress: null,
  isVip: false,

 connectWallet: async (tgId: string, address: string) => {
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

  disconnectWallet: async (tgId: string) => {
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

  checkVipOnBackend: async (tgId: string) => {
    console.log("checkVipOnBackend")
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
  }
}))