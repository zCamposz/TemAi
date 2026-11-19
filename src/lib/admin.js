import { supabase } from "./supabase";

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

export const fetchAdminStats = () => call("admin_stats");
export const fetchAdminProfiles = () => call("admin_list_profiles");
export const fetchAdminProducts = () => call("admin_list_products");

export const setUserVerified = (id, value) =>
  call("admin_set_verified", { target: id, value });

export const setProductStatus = (id, status) =>
  call("admin_set_product_status", { target: id, new_status: status });

export const PRODUCT_STATUS_LABEL = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  suspenso: "Suspenso",
};
