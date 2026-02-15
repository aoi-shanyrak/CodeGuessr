(* 
## Decode a Run-Length Encoded List
*)

type 'a node =
  | One of 'a
  | Many of int*'a

let list = [Many (4, "a"); One "b"; Many (2, "c"); Many (2, "a"); One "d"; Many (4, "e")];;

let decode lst =
    let rec put obj quantity i acc =
        if i=quantity then acc
        else
        put obj quantity (i+1) (obj::acc)
    in
    let rec aux lst acc =
        match lst with
        | [] -> acc
        | One(el)::lst' -> aux lst' (acc@[el])
        | Many(quantity, obj)::lst' -> 
            let res = put obj quantity 0 [] in
            aux lst' (acc@res)
    in
    aux lst []
;;

decode list;;