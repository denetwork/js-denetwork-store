import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TypeUtil } from "denetwork-utils";
import { TQueryListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { EtherWallet } from "web3id";
import { MRemarkEntity } from "../models/MRemarkEntity";

/**
 * 	Follower
 */
export const followerSchema = new Schema( {
	...MBaseEntity,
	address : {
		//	follower's wallet address, CASE INSENSITIVE
		//	e.g.: `0xc8f60eaf5988ac37a2963ac5fabe97f709d6b357`
		type : String,
		validate : {
			validator : ( v : string ) => TypeUtil.isNotEmptyString( v ) && EtherWallet.isValidAddress( v ),
			message: ( props: any ) : string => `invalid ${props.path}`
		},
		required : [ true, '{PATH} required' ]
	},
	name : {
		//	follower's name
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isNotEmptyString( v ) && v.length < 128,
			message: ( props: any ) : string => `invalid ${props.path}, should be less than 128 characters`
		},
		required : false
	},
	avatar : {
		//	follower's avatar
		type : String,
		validate : {
			validator : ( v : any ) => TypeUtil.isNotEmptyString( v ) && v.length < 256,
			message: ( props: any ) : string => `invalid ${props.path}, should be less than 256 characters`
		},
		required : false
	},
	...MRemarkEntity
}, {
	timestamps : true,
	query : {
		byWalletAndAddress( wallet : string, address ? : string )
		{
			if ( undefined !== address )
			{
				return this.where( {
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet,
					address : address
				} );
			}
			else
			{
				return this.where( {
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet
				} );
			}
		},
		byAddress( address : string )
		{
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				address : address
			} );
		},
		byWalletAndHash( wallet : string, hash : string )
		{
			//	find one
			return this.where( {
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
followerSchema.index( { deleted : 1, wallet : 1, address : 1 }, { unique : true } );

followerSchema.method( 'getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.address }`;
} );

export type FollowerType = InferSchemaType<typeof followerSchema> & Document<Types.ObjectId>;
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

export type FollowerListResult = TQueryListResult &
	{
		list : Array<FollowerType>;
	}


export const FollowerModel = model( 'Follower', followerSchema );

//
// followerSchema.pre( 'save', ( next ) =>
// {
// 	console.log( `########## followerSchema.pre self : ` );
// 	next();
//
// 	// const self : FollowerType = this;
// 	//
// 	// if ( self )
// 	// {
// 	// 	FollowerModel.findOne( {
// 	// 		deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
// 	// 		wallet : self.wallet,
// 	// 		address : self.address },
// 	// 		( err : CallbackError | undefined, doc: any ) =>
// 	// 	{
// 	// 		if ( err )
// 	// 		{
// 	// 			return next( err );
// 	// 		}
// 	// 		if ( doc )
// 	// 		{
// 	// 			//	If matching records are found, duplicate data already exists
// 	// 			return next( new Error( 'wallet, address must be unique' ) );
// 	// 		}
// 	//
// 	// 		next();
// 	// 	});
// 	// }
// 	// else
// 	// {
// 	// 	next();
// 	// }
// });
