import { model, Schema, InferSchemaType, Types, Document } from 'mongoose';
import { TQueueListResult } from "../models/TQuery";
import { MBaseEntity } from "../models/MBaseEntity";
import { MRemarkEntity } from "../models/MRemarkEntity";
import { MRefEntity } from "../models/MRefEntity";
import { ERefDataTypes } from "../models/ERefDataTypes";


/**
 * 	Follower
 */
export const favoriteSchema = new Schema( {
	...MBaseEntity,
	...MRefEntity,
	...MRemarkEntity
}, {
	timestamps: true,
	query: {
		//	base query helper
		byId( id : Types.ObjectId )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				_id : id,
			} );
		},
		byHexId( hexId : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				_id : Types.ObjectId.createFromHexString( hexId ),
			} );
		},
		byWalletAndId( wallet : string, id : Types.ObjectId )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				_id : id,
			} );
		},
		byWalletAndHexId( wallet : string, hexId : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				_id : Types.ObjectId.createFromHexString( hexId ),
			} );
		},
		byHash( hash : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				hash : hash
			} );
		},


		byWalletAndRefTypeAndRefHash( wallet : string, refType : ERefDataTypes, refHash : string )
		{
			//	find one
			return this.where( {
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				wallet : wallet,
				refType : refType,
				refHash : refHash,
			} );
		},

		byWalletAndRefType( wallet: string, refType ?: ERefDataTypes )
		{
			if ( undefined !== refType )
			{
				return this.where({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet,
					refType : refType
				} );
			}
			else
			{
				return this.where({
					deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
					wallet : wallet
				} );
			}
		},
		byRefAuthorWallet( refAuthorWallet: string )
		{
			return this.where({
				deleted : Types.ObjectId.createFromTime( 0 ).toHexString(),
				refAuthorWallet : refAuthorWallet,
			} );
		}
	}
} );

/**
 * 	united unique index
 * 	 1 represents ascending index,
 * 	-1 represents descending index
 */
favoriteSchema.index({ deleted : 1, wallet: 1, refType: 1, refHash : 1 }, { unique: true } );

favoriteSchema.method('getUniqueKey', function getUniqueKey()
{
	return `${ this.wallet }-${ this.refType }-${ this.refHash }`;
});

export type FavoriteType = InferSchemaType< typeof favoriteSchema > & Document<Types.ObjectId>;
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

export type FavoriteListResult = TQueueListResult &
{
	list : Array< FavoriteType >;
}


export const FavoriteModel = model( 'Favorite', favoriteSchema );

