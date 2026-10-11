export interface Statement {bind(...values:unknown[]):Statement;all<T>():Promise<{results:T[]}>;run():Promise<unknown>}
export interface Database {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown[]>}
export async function resetLearning(db:Database,user:string){
 await db.batch([
  db.prepare('DELETE FROM learning_answers WHERE user_id = ?').bind(user),
  db.prepare('DELETE FROM learning_attempts WHERE user_id = ?').bind(user),
  db.prepare('DELETE FROM quiz_sessions WHERE user_id = ?').bind(user),
 ]);
 return learningSnapshot(db,user);
}
export async function learningSnapshot(db:Database,user:string){
 const [favorites,answers,history]=await Promise.all([
 db.prepare('SELECT muscle_key FROM learning_favorites WHERE user_id = ? ORDER BY muscle_key').bind(user).all<{muscle_key:string}>(),
 db.prepare('SELECT question_id, correct FROM learning_answers WHERE user_id = ? ORDER BY updated_at DESC, question_id').bind(user).all<{question_id:string;correct:number}>(),
 db.prepare('SELECT attempt_id, question_id, correct, answered_at FROM learning_attempts WHERE user_id = ? ORDER BY answered_at DESC, attempt_id DESC LIMIT 1000').bind(user).all<{attempt_id:string;question_id:string;correct:number;answered_at:number}>()
 ]);return {authenticated:true,favorites:favorites.results.map(x=>x.muscle_key),answers:answers.results.map(x=>({questionId:x.question_id,correct:x.correct===1})),history:history.results.map(x=>({attemptId:x.attempt_id,questionId:x.question_id,correct:x.correct===1,answeredAt:x.answered_at}))};
}
