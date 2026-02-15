(*
## Eliminate Duplicates
*)

let list = ["a"; "b"; "c"; "a"; "d"; "e"; "e"; "b"];;

let compress lst = 
    let rec aux lst acc =
        match lst with
        | [] -> acc
        | x::lst' -> aux (List.filter (fun y -> x<>y) lst') (acc@[x])
    in
    aux lst []
;;

compress list;;