(* Esercizio 2.1. Scrivere una funzione ricorsiva somma_positivi che, data una lista lis di interi, restituisce
la somma degli elementi positivi. Ad esempio, somma_positivi [3;0;-1;2;-4] restituisce 5. 
Usare funzioni higher-order
*)


let rec somma_positivi lis = 
    List.fold_left
        (fun acc x -> if x>0 then acc+x else acc) 
        0 
        lis
    ;;
let prova = [3;0;-1;2;-4];;
let prova_vuota = [];;
somma_positivi prova;;
somma_positivi prova_vuota;;