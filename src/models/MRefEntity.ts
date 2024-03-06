import { TypeUtil } from "denetwork-utils";
import { EtherWallet } from "web3id";
import { ERefDataTypes } from "./ERefDataTypes";

/**
 * 	@module MRefEntity
 */
export const MRefEntity : any = {
	refAuthorWallet : {
		//	QUOTE
		//	wallet address of quoted author
		//	e.g.: `0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357`
		type : String,
		validate : {
			validator : ( v : string ) => TypeUtil.isNotEmptyString( v ) && EtherWallet.isValidAddress( v ),
			message : ( props: any ) : string => `invalid ${ props.path }`
		},
		required : false
	},
	refAuthorName : {
		//	QUOTE/REFERENCED
		//	name of quoted author
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isString( v ) && v.length < 128,
			message : ( props: any ) : string => `invalid ${ props.path }, should be less than 128 characters`
		},
		required : false
	},
	refAuthorAvatar : {
		//	QUOTE/REFERENCED
		//	avtar url of quoted author
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isString( v ) && v.length < 256,
			message : ( props: any ) : string => `invalid ${ props.path }, should be less than 256 characters`
		},
		required : false
	},
	refType : {
		//	QUOTE/REFERENCED type
		type : String,
		validate : {
			validator : ( v : ERefDataTypes ) => Object.values( ERefDataTypes ).includes( v ),
			message : ( props: any ) : string => `invalid ${ props.path }`
		},
		enum : Object.values( ERefDataTypes ),
		required: false
	},
	refHash : {
		//	hash value of quoted content
		//	Keccak-256(SHA-3), see the hash value of the Ethereum data block
		type : String,
		validate : {
			//	Starts with "0x" (case-insensitive)
			validator : ( v : string ) => TypeUtil.isNotEmptyString( v ) && 66 === v.length && /^0x[0-9a-f]{64}$/.test( v ),
			message : ( props: any ) : string => `invalid ${ props.path }, must be 66 lowercase hex characters`
		},
		required: false
	},
	refBody : {
		type : String,
		validate : {
			validator : ( v : string ) => TypeUtil.isString( v ) && v.length < 2048,
			// validator : ( v: string ) => {
			// 	if ( v )
			// 	{
			// 		if ( ! TypeUtil.isNotEmptyString( v ) || v.length > 2048 )
			// 		{
			// 			return false;
			// 		}
			// 	}
			// 	return true;
			// },
			message : ( props: any ) : string => `invalid ${ props.path }, must be less than 2048 characters`
		},
		required : false
	},
};
