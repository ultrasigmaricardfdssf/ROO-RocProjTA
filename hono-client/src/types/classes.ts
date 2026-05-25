export type User = {
    id : number,
    username : string,
    password : string,
    email : string,
    created_at : number,
    role_id : number | 0,
    about_me : string | null,
    notifiable : boolean
}

export type UserRole = {
    id : number,
    color : string | "#AAAAAA",
    canReply : boolean,
    canDeleteReply : boolean,
    canDeleteForum : boolean,
    canPostTicket : boolean,
    canAcceptTicket : boolean,
    canChat : boolean
}

export type ForumQuestion = {
    id : number,
    user_id : number,
    title : string,
    content : string,
    tag_id : number | 0,
    created_at : number,
    edited_at : number | null,
    solution_id : number | null
}

export type ForumTag = {
    id : number,
    color : string | "#AAAAAA",
    name : string,
    short : string | null
}

export type ForumReaction = {
    id : number,
    forum_id : number,
    user_id : number
}

export type ForumReply = {
    id : number,
    user_id : number,
    forum_id : number,
    content : string,
    created_at : number
}

export type ForumReplyReaction = {
    id : number,
    reply_id : number,
    user_id : number
}

export type Ticket = {
    id : number,
    priority_id : number | 0,
    requester_id : number,
    subject : string,
    description : string,
    created_at : number,
    resolved_at : number | null,
    resolved_by : number | null
}

export type TicketPriority = {
    id : number,
    color : string | "#AAAAAA",
    name : string
}

export type TicketReply = {
    id : number,
    ticket_id : number,
    user_id : number,
    content : string,
    created_at : number
}