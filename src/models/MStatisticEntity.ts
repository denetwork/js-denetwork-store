import { TypeUtil } from "denetwork-utils";

/**
 * 	@module MStatisticEntity
 */
export const MStatisticEntity : any = {
	statisticView : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: [ true, '{PATH} required' ]
	},
	statisticRepost : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: [ true, '{PATH} required' ]
	},
	statisticQuote : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: [ true, '{PATH} required' ]
	},
	statisticLike : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: [ true, '{PATH} required' ]
	},
	statisticFavorite : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: [ true, '{PATH} required' ]
	},
	statisticReply : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: [ true, '{PATH} required' ]
	},
};
