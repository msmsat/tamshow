from fastapi import APIRouter, Depends
from pydantic import BaseModel
from web3 import Web3

# Ваш роутер! Мы сразу говорим, что все пути тут начинаются с /api/wallet
router = APIRouter(
    prefix="/api/wallet",
    tags=["Wallet"]
)

# ==========================================
# 🌐 НАСТРОЙКИ БЛОКЧЕЙНА (Web3)
# ==========================================
RPC_URL = "https://polygon-rpc.com" 
w3 = Web3(Web3.HTTPProvider(RPC_URL))
NFT_CONTRACT_ADDRESS = w3.to_checksum_address("0x2953399124F0cBB46d2CbAcD8A89cF0599974963")
MINIMAL_ABI = [{"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}]
nft_contract = w3.eth.contract(address=NFT_CONTRACT_ADDRESS, abi=MINIMAL_ABI)


# ==========================================
# 🛠 ЭНДПОИНТЫ
# ==========================================
class WalletConnectRequest(BaseModel):
    tg_id: str
    wallet_address: str

# Обратите внимание: путь просто "/connect", потому что префикс "/api/wallet" добавится сам!
@router.post("/connect")
async def connect_wallet(req: WalletConnectRequest):
    print("=" * 40)
    print("🔗 ПРИВЯЗКА КОШЕЛЬКА И ПРОВЕРКА БЛОКЧЕЙНА")
    print(f"👤 Telegram ID : {req.tg_id}")
    print(f"👛 Адрес       : {req.wallet_address}")
    
    nft_balance = 0
    
    try:
        if w3.is_address(req.wallet_address):
            checksum_address = w3.to_checksum_address(req.wallet_address)
            nft_balance = nft_contract.functions.balanceOf(checksum_address).call()
            print(f"💎 Найдено NFT : {nft_balance} шт.")
        else:
            print("❌ Ошибка: Неверный формат кошелька!")
    except Exception as e:
        print(f"⚠️ Ошибка связи с блокчейном: {e}")
    print("=" * 40)
    
    return {
        "success": True, 
        "wallet_address": req.wallet_address,
        "nft_balance": nft_balance,
        "is_vip": nft_balance > 0
    }

# Сюда же позже добавим @router.get("/status") для проверки при входе