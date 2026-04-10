from algosdk import account, mnemonic

def create_new_account():
    # Generate a new private key
    private_key, address = account.generate_account()
    
    # Get the 25-word mnemonic from the private key
    passphrase = mnemonic.from_private_key(private_key)
    
    print("-" * 50)
    print("--- NEW ALGORAND ACCOUNT GENERATED ---")
    print("-" * 50)
    print(f"Address:  {address}")
    print(f"Mnemonic: {passphrase}")
    print("-" * 50)
    print("IMPORTANT: For Testnet, you must fund this address before it can make transactions!")
    print("Fund it here: https://bank.testnet.algorand.network/")
    print("-" * 50)

if __name__ == "__main__":
    create_new_account()
