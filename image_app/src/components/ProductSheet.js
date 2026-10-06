import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

const COMPANY_NAME = "Ramchandra Dresses";
const BROWN = "#5b3a1e";
const LINE = "#e2d6c4";

const uniq = (list) => [...new Set(list.filter(Boolean))];

function buildRows(products) {
  const sizes = uniq(
    products.flatMap((p) => (p.sizes || []).map((s) => s.size)),
  );
  const rates = products
    .flatMap((p) => (p.sizes || []).map((s) => Number(s.rate)))
    .filter((n) => !Number.isNaN(n) && n > 0);
  let rate = "";
  if (rates.length) {
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    rate = min === max ? `₹ ${min}` : `₹ ${min} - ₹ ${max}`;
  }
  const groups = uniq(
    products.map((p) =>
      [p.category?.name, p.sub_category?.name].filter(Boolean).join(" / "),
    ),
  );
  return [
    ["Company Name", COMPANY_NAME],
    ["Design Number", uniq(products.map((p) => p.design_number)).join(" / ")],
    ["Colour", uniq(products.map((p) => p.colour || p.color)).join(" / ")],
    ["Size", sizes.join(" | ")],
    ["Rate", rate],
    ["Group", groups.join(", ")],
  ].filter(([, v]) => v);
}

export default function ProductSheet({ items = [] }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const list = items.filter((it) => it.uri);
  if (!list.length) return null;

  const hero = list[Math.min(heroIdx, list.length - 1)];

  const seen = new Set();
  const products = [];
  list.forEach((it) => {
    const p = it.product;
    if (!p) return;
    const key = p.id ?? p.design_number;
    if (seen.has(key)) return;
    seen.add(key);
    products.push(p);
  });
  const rows = buildRows(products);

  return (
    <View
      style={{
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        backgroundColor: "#fbf6ec",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: LINE,
        padding: 14,
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: "800",
          color: BROWN,
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {COMPANY_NAME}
      </Text>

      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: LINE,
          backgroundColor: "#f4ede2",
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: hero.uri }}
          style={{ width: "100%", aspectRatio: 4 / 5 }}
          resizeMode="contain"
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
        }}
      >
        {list.map((it, i) => {
          const active = i === Math.min(heroIdx, list.length - 1);
          return (
            <Pressable
              key={i}
              onPress={() => setHeroIdx(i)}
              style={{ width: "23%", alignItems: "center" }}
            >
              <Image
                source={{ uri: it.uri }}
                style={{
                  width: "100%",
                  aspectRatio: 3 / 4,
                  borderRadius: 8,
                  backgroundColor: "#f4ede2",
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? BROWN : LINE,
                }}
                resizeMode="contain"
              />
              {it.product?.design_number ? (
                <Text
                  style={{
                    marginTop: 4,
                    backgroundColor: BROWN,
                    color: "white",
                    fontSize: 10,
                    fontWeight: "700",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {it.product.design_number}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: LINE,
          borderRadius: 12,
          backgroundColor: "#fffaf2",
          overflow: "hidden",
        }}
      >
        {rows.map(([label, value], i) => (
          <View
            key={label}
            style={{
              flexDirection: "row",
              borderTopWidth: i ? 1 : 0,
              borderColor: LINE,
            }}
          >
            <Text
              style={{
                width: 112,
                paddingVertical: 8,
                paddingHorizontal: 10,
                fontWeight: "700",
                color: BROWN,
                fontSize: 12,
                borderRightWidth: 1,
                borderColor: LINE,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 10,
                color: "#1e293b",
                fontSize: 12,
              }}
            >
              {String(value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}