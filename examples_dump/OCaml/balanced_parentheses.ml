(* 
   Esercizio 2.3:
   Scrivere una funzione ricorsiva parentesi_bilanciate che, 
   data una lista lis di caratteri, restituisce true se la lista 
   contiene una sequenza di caratteri '(' e ')' bilanciata.
   
   Esempi:
   - parentesi_bilanciate ['(';'(';')';'(';'(';')';')';')'] -> true
   - parentesi_bilanciate ['(';'(';')';')';')'] -> false
*)

let parentesi_bilanciate lis =
    let rec aux lis count =
        match lis with
        | [] -> count = 0  (* La lista è bilanciata se il contatore è zero *)
        | '('::rest -> aux rest (count + 1)  (* Incrementa il contatore per '(' *)
        | ')'::rest -> 
            if count > 0 then aux rest (count - 1)  (* Decrementa solo se count > 0 *)
            else false  (* Se count è zero e troviamo ')', non è bilanciato *)
        | _::rest -> aux rest count  (* Ignora altri caratteri *)
    in
    aux lis 0;;


let lst1 = ['(';'(';')';'(';'(';')';')';')'];;
let lst2 = ['(';'(';')';')';')'];;
parentesi_bilanciate lst1;;
parentesi_bilanciate lst2;;