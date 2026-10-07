import React, { useState } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";

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
  const { width: winW } = useWindowDimensions();
  const [heroIdx, setHeroIdx] = useState(0);
  const list = items.filter((it) => it.uri);
  if (!list.length) return null;

  // Sizes in real pixels so it fits phone and laptop
  const sheetW = Math.min(winW - 32, 520);
  const inner = sheetW - 30;
  const gap = 8;
  const thumbW = Math.floor((inner - gap * 3) / 4);
  const heroH = Math.round(inner * 0.9);

  const activeIdx = Math.min(heroIdx, list.length - 1);
  const hero = list[activeIdx];

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
        width: sheetW,
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
          fontSize: 20,
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
          width: inner,
          height: heroH,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: LINE,
          backgroundColor: "#f4ede2",
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: hero.uri }}
          style={{ width: inner - 2, height: heroH - 2 }}
          resizeMode="contain"
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
        {list.map((it, i) => {
          const active = i === activeIdx;
          return (
            <Pressable
              key={i}
              onPress={() => setHeroIdx(i)}
              style={{
                width: thumbW,
                alignItems: "center",
                marginRight: (i + 1) % 4 === 0 ? 0 : gap,
                marginBottom: 8,
              }}
            >
              <Image
                source={{ uri: it.uri }}
                style={{
                  width: thumbW,
                  height: Math.round(thumbW * 1.25),
                  borderRadius: 8,
                  backgroundColor: "#f4ede2",
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? BROWN : LINE,
                }}
                resizeMode="contain"
              />
              {it.product?.design_number ? (
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 4,
                    backgroundColor: BROWN,
                    color: "white",
                    fontSize: 9,
                    fontWeight: "700",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                    overflow: "hidden",
                    maxWidth: thumbW,
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
          marginTop: 6,
          width: inner,
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
                width: 100,
                paddingVertical: 8,
                paddingHorizontal: 8,
                fontWeight: "700",
                color: BROWN,
                fontSize: 11,
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
                paddingHorizontal: 8,
                color: "#1e293b",
                fontSize: 11,
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