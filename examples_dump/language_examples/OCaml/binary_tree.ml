(* Si definisca, usando i costrutti di programmazione funzionale di OCaml, una funzione flat con tipo
flat : btree -> int list list
tale che flat bt restituisca una lista contenente le liste di valori presenti ad ogni livello di profondit`a
dell'albero.
Ad esempio dato il seguente albero binario (a destra in una rappresentazione visuale):
let bt =
Node (3,
Node (5,
Node(1,Void,Void),
Void
),
Node (-4,
Node(6,Void,Void),
Node(8,Void,Void)
)
)
abbiamo che flat bt restituisce [[3],[5,-4],[1,6,8]]. *)

type btree =
| Void
| Node of int * btree * btree;;

let flat bt =
  let rec aux bt acc level =
    match bt with
    | Void -> acc
    | Node (n, sx, dx) ->
        let new_acc =
          if List.length acc <= level then
            acc @ [[n]] (* Crea una nuova lista per il livello corrente *)
          else
            List.mapi (fun i lst -> if i = level then lst @ [n] else lst) acc
        in
        let acc_sx = aux sx new_acc (level + 1) in
        aux dx acc_sx (level + 1)
  in
  aux bt [] 0
;;

let bt =
Node (3,
Node (5,
Node(1,Void,Void),
Void
),
Node (-4,
Node(6,Void,Void),
Node(8,Void,Void)
)
)
;;

flat bt;;

