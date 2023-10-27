import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "denetwork-utils";
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { EtherWallet } from "web3id";
import { MRemarkEntity } from "../models/MRemarkEntity";

/**
 * 	Contact
 */
export const contactSchema = new Schema( {
	...MBaseEntity,
	name : {
		//	user's name
		type : String,
		required : false
	},
	address : {
		//	user's wallet address, CASE SENSITIVE
		//	e.g.: `0xC8F60EaF5988aC37a2963aC5Fabe97f709d6b357`
		type : String,
		validate: {
			validator : ( v: string ) => TypeUtil.isNotEmptyString( v ) && EtherWallet.isValidAddress( v ),
			message: ( props: any ) : string => `invalid ${props.path}`
		},
		required: [ true, '{PATH} required' ]
	},
	avatar : {
		type : String,
		required : false
	},
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		byWalletAndAddress( wallet: string, address ?: string )
		{
			if ( undefined !== address )
			{
				//	unique key
				return this.where({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet,
					address : address } );
			}
			else
			{
				return this.where({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet } );
			}
		},
		byWalletAndHash( wallet: string, hash : string )
		{
			//	unique key
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
contactSchema.index({ deleted : 1, wallet: 1, address: 1 }, { unique: true } );

contactSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.address }`;
});

export type ContactType = InferSchemaType< typeof contactSchema > & Document<Types.ObjectId>;
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

export type ContactListResult = TQueueListResult &
{
	list : Array< ContactType >;
}


export const ContactModel = model( 'Contact', contactSchema );
