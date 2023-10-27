export interface IValidator<T>
{
	validateSignature( signerWalletAddress: string, data : T, sig : string ) : Promise<boolean>;
}
