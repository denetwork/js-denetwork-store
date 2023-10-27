import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "denetwork-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";

/**
 * 	Profile
 */
export const profileSchema = new Schema( {
	...MBaseEntity,
	key : {
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) : string => `invalid ${props.path}`
		},
		required: [ true, '{PATH} required' ]
	},
	value : {
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && v.length < 2048,
			message: ( props: any ) : string => `invalid ${props.path}`
		},
		required: [ true, '{PATH} required' ]
	},
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWallet( wallet: string )
		{
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet
			} );
		},
		byWalletAndKey( wallet: string, key : string )
		{
			//	find one
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				key : key,
			} );
		},
		byWalletAndHash( wallet: string, hash : string )
		{
			//	find one
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				hash : hash,
			} );
		}
	}
} );

/**
 * 	united unique index
 * 	 1 represents ascending index,
 * 	-1 represents descending index
 */
profileSchema.index({ deleted : 1, wallet: 1, key: 1 }, { unique: true } );

profileSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.key }`;
});

export type ProfileType = InferSchemaType< typeof profileSchema > & Document<Types.ObjectId>;
// InferSchemaType will determine the type as follows:
// type ContactsType = {
//	version : string;
//	wallet : string;
//	sig : string;
//	name ?: string;
//	address : string;
//	avatar ?: string;
//	remark ?: string;
// }

export type ProfileListResult = TQueueListResult &
{
	list : Array< ProfileType >;
}


export const ProfileModel = model( 'Profile', profileSchema );
