import { SortOrder } from "mongoose";

export type TQueueListOptions =
	{
		pageNo? : number,
		pageSize? : number,
		pageKey? : number,
		sort? : { [ key : string ] : SortOrder },
	};

export type TQueueListResult = TQueueListOptions &
	{
		total : number,
	};
