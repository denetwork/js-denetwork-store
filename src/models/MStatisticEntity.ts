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
		//required: [ true, '{PATH} required' ]
		required: false
	},
	statisticRepost : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
	statisticQuote : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
	statisticLike : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
	statisticFavorite : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
	statisticReply : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
	statisticComment : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
	statisticShare : {
		type : Number,
		validate: {
			validator : ( v: any ) => TypeUtil.isNumeric( v ) && v >= 0,
			message: ( props: any ) : string => `invalid ${props.path}, should be greater than or equal to 0`
		},
		required: false
	},
};
