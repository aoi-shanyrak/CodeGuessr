(* Esercizio 2.2. Scrivere una funzione ricorsiva somma_liste che, date due liste [x1;...;xn] e [y1;...;yn]
di uguale lunghezza, restituisca la lista [x1+y1; ... ;xn+yn]. Se le liste hanno lunghezze diverse, la
funzione restituisce la lista vuota. 
Usare funzioni higher-order
*)


let somma_liste lst1 lst2 =
  if List.length lst1 <> List.length lst2 then
    []
  else
    (List.fold_left2 (fun acc x y -> acc @ [(x + y)]) [] lst1 lst2)
;;

let lis1 = [1;2;3;4];;
let lis2 = [1;2;3;4];;

somma_liste lis1 lis2;;